using BCrypt.Net;
using MongoDB.Driver;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using server.Data;
using server.DTOs;
using server.Helpers;
using server.Models;

namespace server.Services;

/// <summary>
/// Authentication service - handles user registration and login
/// Uses BCrypt for password hashing and JWT for token generation
/// Properly handles MongoDB Atlas connectivity issues
/// </summary>
public class AuthService
{
    private readonly MongoDbContext _context;
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<AuthService> _logger;

    public AuthService(MongoDbContext context, IOptions<JwtSettings> jwtOptions, ILogger<AuthService> logger)
    {
        // keep references so methods can work with database, tokens, and logging
        _context = context;
        _jwtSettings = jwtOptions.Value;
        _logger = logger;
    }

    /// <summary>
    /// Register new user account
    /// - Validates input data
    /// - Normalizes email to lowercase for consistency
    /// - Hashes password using BCrypt
    /// - Stores in MongoDB and returns JWT token
    /// </summary>
    public async Task<ResponseWrapper<AuthResponse>> RegisterAsync(RegisterRequest request)
    {
        try
        {
            // Validate request
            if (request == null)
            {
                return ResponseWrapper<AuthResponse>.Fail("Invalid registration request");
            }

            // Normalize inputs - trim whitespace, convert email to lowercase
            var username = request.Username?.Trim() ?? string.Empty;
            var email = request.Email?.Trim().ToLower() ?? string.Empty;
            var password = request.Password?.Trim() ?? string.Empty;

            // Validate email format
            if (string.IsNullOrEmpty(email) || !email.Contains("@"))
            {
                _logger.LogWarning($"Registration failed - invalid email: {email}");
                return ResponseWrapper<AuthResponse>.Fail("Invalid email format");
            }

            // Check if user already exists by email or username
            var existingEmailUser = await _context.Users
                .Find(u => u.Email == email)
                .FirstOrDefaultAsync()
                .ConfigureAwait(false);

            if (existingEmailUser != null)
            {
                _logger.LogWarning($"Registration failed - email already exists: {email}");
                return ResponseWrapper<AuthResponse>.Fail("Email already registered");
            }

            var existingUsernameUser = await _context.Users
                .Find(u => u.Username == username)
                .FirstOrDefaultAsync()
                .ConfigureAwait(false);

            if (existingUsernameUser != null)
            {
                _logger.LogWarning($"Registration failed - username already exists: {username}");
                return ResponseWrapper<AuthResponse>.Fail("Username already taken");
            }

            // Create new user with hashed password
            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = username,
                Email = email, // Stored as lowercase
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                Role = string.IsNullOrWhiteSpace(request.Role) ? "Staff" : request.Role.Trim(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsActive = true
            };

            // Insert into database
            await _context.Users.InsertOneAsync(user).ConfigureAwait(false);
            _logger.LogInformation($"User registered successfully: {username} ({email})");

            // Generate JWT token
            var expiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes);
            var token = JwtHelper.GenerateToken(user, _jwtSettings);

            // Return success response with auth details
            var response = new AuthResponse
            {
                Token = token,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                ExpiresAt = expiresAt
            };

            return ResponseWrapper<AuthResponse>.Ok(response, "Registration successful");
        }
        catch (MongoWriteException ex) when (ex.WriteError?.Category == ServerErrorCategory.DuplicateKey)
        {
            _logger.LogError($"Registration failed - duplicate key: {ex.Message}");
            return ResponseWrapper<AuthResponse>.Fail("User already exists");
        }
        catch (MongoException ex)
        {
            _logger.LogError($"Registration failed - database error: {ex.Message}");
            return ResponseWrapper<AuthResponse>.Fail("Database error during registration");
        }
        catch (Exception ex)
        {
            _logger.LogError($"Registration failed - unexpected error: {ex.Message}");
            return ResponseWrapper<AuthResponse>.Fail("Registration failed");
        }
    }

    /// <summary>
    /// Login user with credentials
    /// - Accepts either username or email (email treated as case-insensitive, stored as lowercase)
    /// - Validates password using BCrypt
    /// - Returns JWT token if credentials are valid
    /// </summary>
    public async Task<ResponseWrapper<AuthResponse>> LoginAsync(LoginRequest request)
    {
        try
        {
            // Validate request
            if (request == null)
            {
                return ResponseWrapper<AuthResponse>.Fail("Invalid login request");
            }

            var input = request.UsernameOrEmail?.Trim() ?? string.Empty;
            var password = request.Password?.Trim() ?? string.Empty;

            if (string.IsNullOrEmpty(input) || string.IsNullOrEmpty(password))
            {
                _logger.LogWarning("Login failed - missing credentials");
                return ResponseWrapper<AuthResponse>.Fail("Username/email and password required");
            }

            // Treat input as email if it contains @ symbol, otherwise as username
            User? user = null;

            if (input.Contains("@"))
            {
                // Search by email (case-insensitive - stored as lowercase)
                user = await _context.Users
                    .Find(u => u.Email == input.ToLower())
                    .FirstOrDefaultAsync()
                    .ConfigureAwait(false);
            }
            else
            {
                // Search by username (case-sensitive)
                user = await _context.Users
                    .Find(u => u.Username == input)
                    .FirstOrDefaultAsync()
                    .ConfigureAwait(false);
            }

            // User not found
            if (user == null)
            {
                _logger.LogWarning($"Login failed - user not found: {input}");
                return ResponseWrapper<AuthResponse>.Fail("Invalid credentials");
            }

            // Check if account is active
            if (!user.IsActive)
            {
                _logger.LogWarning($"Login failed - inactive account: {input}");
                return ResponseWrapper<AuthResponse>.Fail("Account is inactive");
            }

            // Verify password
            var isPasswordValid = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);

            if (!isPasswordValid)
            {
                _logger.LogWarning($"Login failed - invalid password: {input}");
                return ResponseWrapper<AuthResponse>.Fail("Invalid credentials");
            }

            _logger.LogInformation($"User logged in successfully: {user.Username}");

            // Generate JWT token
            var expiresAt = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes);
            var token = JwtHelper.GenerateToken(user, _jwtSettings);

            // Return success response with auth details
            var response = new AuthResponse
            {
                Token = token,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                ExpiresAt = expiresAt
            };

            return ResponseWrapper<AuthResponse>.Ok(response, "Login successful");
        }
        catch (MongoException ex)
        {
            _logger.LogError($"Login failed - database error: {ex.Message}");
            return ResponseWrapper<AuthResponse>.Fail("Database error during login");
        }
        catch (Exception ex)
        {
            _logger.LogError($"Login failed - unexpected error: {ex.Message}");
            return ResponseWrapper<AuthResponse>.Fail("Login failed");
        }
    }

    /// <summary>
    /// Verify if email is available for registration
    /// </summary>
    public async Task<ResponseWrapper<bool>> IsEmailAvailableAsync(string email)
    {
        try
        {
            var normalizedEmail = email?.Trim().ToLower() ?? string.Empty;

            if (string.IsNullOrEmpty(normalizedEmail) || !normalizedEmail.Contains("@"))
            {
                return ResponseWrapper<bool>.Fail("Invalid email");
            }

            var existingUser = await _context.Users
                .Find(u => u.Email == normalizedEmail)
                .FirstOrDefaultAsync()
                .ConfigureAwait(false);

            // true means email free to use
            return ResponseWrapper<bool>.Ok(existingUser == null);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error checking email availability: {ex.Message}");
            return ResponseWrapper<bool>.Fail("Error checking email availability");
        }
    }

    /// <summary>
    /// Verify if username is available for registration
    /// </summary>
    public async Task<ResponseWrapper<bool>> IsUsernameAvailableAsync(string username)
    {
        try
        {
            var trimmedUsername = username?.Trim() ?? string.Empty;

            if (string.IsNullOrEmpty(trimmedUsername))
            {
                return ResponseWrapper<bool>.Fail("Invalid username");
            }

            var existingUser = await _context.Users
                .Find(u => u.Username == trimmedUsername)
                .FirstOrDefaultAsync()
                .ConfigureAwait(false);

            // true means username available
            return ResponseWrapper<bool>.Ok(existingUser == null);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error checking username availability: {ex.Message}");
            return ResponseWrapper<bool>.Fail("Error checking username availability");
        }
    }
}
