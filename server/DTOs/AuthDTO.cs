using System.ComponentModel.DataAnnotations;

namespace server.DTOs;

/// <summary>
/// Login request - user credentials for authentication
/// Accepts either username or email with password
/// </summary>
public class LoginRequest
{
    [Required(ErrorMessage = "Username or email is required")]
    [StringLength(255, MinimumLength = 3, ErrorMessage = "Username/email must be between 3-255 characters")]
    // allow login with either username or email field
    public string UsernameOrEmail { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [StringLength(255, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
    // typed password from client
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// Registration request - new user account creation
/// </summary>
public class RegisterRequest
{
    [Required(ErrorMessage = "Username is required")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3-50 characters")]
    [RegularExpression(@"^[a-zA-Z0-9_-]+$", ErrorMessage = "Username can only contain letters, numbers, underscore and hyphen")]
    // username we store for login
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(255, ErrorMessage = "Email cannot exceed 255 characters")]
    // contact email used for uniqueness checks
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [StringLength(255, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
    // plain password string before hashing in service
    public string Password { get; set; } = string.Empty;

    // Optional role - defaults to Staff if not provided
    [StringLength(50, ErrorMessage = "Role cannot exceed 50 characters")]
    // optional role override on registration
    public string? Role { get; set; }
}

/// <summary>
/// Authentication response - returned after successful login/registration
/// Contains JWT token and user information
/// </summary>
public class AuthResponse
{
    // JWT token string returned to client
    public string Token { get; set; } = string.Empty;
    // username displayed on dashboard
    public string Username { get; set; } = string.Empty;
    // email for client side needs
    public string Email { get; set; } = string.Empty;
    // role used for permission checks
    public string Role { get; set; } = string.Empty;
    // token expiry timestamp for refresh handling
    public DateTime ExpiresAt { get; set; }
}
