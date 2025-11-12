using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace server.Models;

/// <summary>
/// User model - represents application user with authentication
/// Email is stored lowercase for consistent lookups
/// </summary>
public class User
{
    [BsonId]
    // user id stored in Mongo
    public Guid Id { get; set; } = Guid.NewGuid();
    
    // Username - unique identifier, case-sensitive storage but case-insensitive lookup
    public string Username { get; set; } = string.Empty;
    
    // Email - stored lowercase for consistency and case-insensitive matching
    public string Email { get; set; } = string.Empty;
    
    // BCrypt hashed password - never store plain text
    public string PasswordHash { get; set; } = string.Empty;
    
    // User role - Admin or Staff
    public string Role { get; set; } = "Staff";
    
    // Account creation timestamp
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Account update timestamp - for audit trail
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Account status - for soft deletes
    public bool IsActive { get; set; } = true;
}
