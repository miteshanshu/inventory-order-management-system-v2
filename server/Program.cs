using System.IO;
using System.Text;
using System.Text.Json.Serialization;
using MongoDB.Driver;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.Extensions.Options;
using server.Data;
using server.Helpers;
using server.Services;

// Configure MongoDB GUID Serialization FIRST
BsonSerializer.RegisterSerializer(new GuidSerializer(GuidRepresentation.Standard));

// load optional environment overrides from .env
LoadEnvFile();

var builder = WebApplication.CreateBuilder(args);

// include OS environment variables
builder.Configuration.AddEnvironmentVariables();

// Logging
builder.Services.AddLogging(config =>
{
    config.ClearProviders();
    config.AddConsole();
    config.SetMinimumLevel(LogLevel.Information);
});

// Load settings
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();
var mongoDbSettings = builder.Configuration.GetSection("MongoDb").Get<MongoDbSettings>();

if (string.IsNullOrEmpty(mongoDbSettings?.ConnectionString))
    throw new InvalidOperationException("MongoDB connection string is missing in configuration.");

if (string.IsNullOrEmpty(jwtSettings?.Secret) || jwtSettings.Secret.Length < 32)
    throw new InvalidOperationException("JWT secret key is invalid or too short (minimum 32 chars).");

// MVC / JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// Swagger
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Inventory API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Enter JWT token",
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        BearerFormat = "JWT",
        Scheme = "bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// Options binding
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDb"));

// ---- MongoDB (no credential helpers; rely on URI) ----
// create one shared Mongo client for the app lifetime
builder.Services.AddSingleton<IMongoClient>(sp =>
{
    var cfg = sp.GetRequiredService<IOptions<MongoDbSettings>>().Value;

    // Ensure URI carries mechanism & auth DB:
    // e.g. ...?authMechanism=SCRAM-SHA-256&authSource=admin
    var url = new MongoUrl(cfg.ConnectionString);
    var settings = MongoClientSettings.FromUrl(url);

    // Optional: Stable API for Atlas
    try { settings.ServerApi = new ServerApi(ServerApiVersion.V1); } catch { }

    var client = new MongoClient(settings);

    // Early ping to surface auth issues immediately
    try
    {
        var authDb = url.AuthenticationSource ?? "admin";
        // run ping early to fail fast if credentials wrong
        client.GetDatabase(authDb).RunCommand<BsonDocument>(new BsonDocument("ping", 1));
        Console.WriteLine("✅ MongoDB connection successful.");
    }
    catch (MongoAuthenticationException authEx)
    {
        throw new InvalidOperationException(
            "MongoDB authentication failed. Check username/password in the URI, URL-encoding, authSource, and authMechanism.",
            authEx
        );
    }

    return client;
});

// DbContext
// provide MongoDbContext per request using shared client
builder.Services.AddScoped(sp =>
{
    var client = sp.GetRequiredService<IMongoClient>();
    var mongoCfg = sp.GetRequiredService<IOptions<MongoDbSettings>>().Value;
    return new MongoDbContext(client, mongoCfg.DatabaseName ?? "InventoryDB");
});

// JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings!.Secret)),
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,
            ValidateLifetime = true
        };
    });

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<OrderService>();
builder.Services.AddScoped<SupplierService>();
builder.Services.AddScoped<CategoryService>();

var app = builder.Build();

// Init DB + seed
using (var scope = app.Services.CreateScope())
{
    var mongoDbContext = scope.ServiceProvider.GetRequiredService<MongoDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        await mongoDbContext.InitializeAsync();
        await SeedData.InitializeAsync(mongoDbContext);
        logger.LogInformation("✅ MongoDB initialized and seeded successfully.");
    }
    catch (Exception ex)
    {
        logger.LogWarning($"⚠️ MongoDB initialization failed: {ex.Message}. Server will continue without seeding.");
    }
}

// Pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHttpsRedirection();
}

app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();

static void LoadEnvFile()
{
    var baseDir = AppContext.BaseDirectory;
    var currentDir = Directory.GetCurrentDirectory();
    foreach (var path in new[] { Path.Combine(baseDir, ".env"), Path.Combine(currentDir, ".env") })
    {
        if (!File.Exists(path))
            continue;
        // read each assignment from the .env file
        foreach (var rawLine in File.ReadAllLines(path))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith("#"))
                continue;
            var equalsIndex = line.IndexOf('=');
            if (equalsIndex <= 0)
                continue;
            var key = line[..equalsIndex].Trim();
            if (key.StartsWith("export ", StringComparison.OrdinalIgnoreCase))
                key = key[7..].Trim();
            if (key.Length == 0)
                continue;
            var value = line[(equalsIndex + 1)..].Trim();
            if (value.Length >= 2 && value.StartsWith('"') && value.EndsWith('"'))
                value = value[1..^1];
            else if (value.Length >= 2 && value.StartsWith('\'') && value.EndsWith('\''))
                value = value[1..^1];
            // push value into current process environment
            Environment.SetEnvironmentVariable(key, value);
        }
        break;
    }
}
