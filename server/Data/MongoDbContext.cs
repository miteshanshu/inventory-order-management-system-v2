using MongoDB.Driver;
using server.Models;

namespace server.Data;

/// <summary>
/// MongoDB database context - provides collections for all entities
/// Handles database initialization and index creation for better query performance
/// </summary>
public class MongoDbContext
{
    private readonly IMongoDatabase _database;

    public MongoDbContext(IMongoClient mongoClient, string databaseName)
    {
        // grab database instance once so every collection call reuses it
        _database = mongoClient.GetDatabase(databaseName);
    }

    // Collections for each entity type
    public IMongoCollection<User> Users => _database.GetCollection<User>("users");
    public IMongoCollection<Product> Products => _database.GetCollection<Product>("products");
    public IMongoCollection<Category> Categories => _database.GetCollection<Category>("categories");
    public IMongoCollection<Supplier> Suppliers => _database.GetCollection<Supplier>("suppliers");
    public IMongoCollection<Order> Orders => _database.GetCollection<Order>("orders");
    public IMongoCollection<OrderItem> OrderItems => _database.GetCollection<OrderItem>("order_items");

    /// <summary>
    /// Initialize database - create indexes for better query performance
    /// Called once on application startup
    /// </summary>
    public async Task InitializeAsync()
    {
        try
        {
            // build indexes once on startup for faster queries
            await CreateIndexesAsync();
        }
        catch (Exception ex)
        {
            // Log but don't fail - indexes might already exist
            Console.WriteLine($"Index creation warning: {ex.Message}");
        }
    }

    /// <summary>
    /// Create database indexes for frequently searched fields
    /// Improves query performance and ensures unique constraints
    /// </summary>
    private async Task CreateIndexesAsync()
    {
        // User email unique index (lowercase for consistent case-insensitive lookups)
        // keep one account per email address
        var userEmailIndexModel = new CreateIndexModel<User>(
            Builders<User>.IndexKeys.Ascending(u => u.Email),
            new CreateIndexOptions { Unique = true }
        );
        await Users.Indexes.CreateOneAsync(userEmailIndexModel).ConfigureAwait(false);

        // lock usernames so two users cannot share the same name
        var userUsernameIndexModel = new CreateIndexModel<User>(
            Builders<User>.IndexKeys.Ascending(u => u.Username),
            new CreateIndexOptions { Unique = true }
        );
        await Users.Indexes.CreateOneAsync(userUsernameIndexModel).ConfigureAwait(false);

        // stop duplicate SKUs from entering catalog
        var productSkuIndexModel = new CreateIndexModel<Product>(
            Builders<Product>.IndexKeys.Ascending(p => p.Sku),
            new CreateIndexOptions { Unique = true }
        );
        await Products.Indexes.CreateOneAsync(productSkuIndexModel).ConfigureAwait(false);

        // speed up category filters
        var productCategoryIndexModel = new CreateIndexModel<Product>(
            Builders<Product>.IndexKeys.Ascending(p => p.CategoryId)
        );
        await Products.Indexes.CreateOneAsync(productCategoryIndexModel).ConfigureAwait(false);

        // help order history sort by most recent
        var orderDateIndexModel = new CreateIndexModel<Order>(
            Builders<Order>.IndexKeys.Descending(o => o.OrderDate)
        );
        await Orders.Indexes.CreateOneAsync(orderDateIndexModel).ConfigureAwait(false);
    }
}
