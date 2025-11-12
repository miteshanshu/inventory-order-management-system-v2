using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using server.Models;

namespace server.Helpers;

/// <summary>
/// Helper class for generating and managing JWT tokens
/// </summary>
public static class JwtHelper
{
    /// <summary>
    /// Generates a JWT token for authenticated users
    /// Token includes user claims and expires after the configured time
    /// </summary>
    public static string GenerateToken(User user, JwtSettings settings)
    {
        // Add user information as claims to the token
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role)
        };

        // Create signing key from secret
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.Secret));
        // credentials to sign token hash
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        
        // Create token with expiration
        var token = new JwtSecurityToken(
            settings.Issuer, 
            settings.Audience, 
            claims, 
            expires: DateTime.UtcNow.AddMinutes(settings.ExpiryMinutes), 
            signingCredentials: credentials
        );
        
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

/// <summary>
/// JWT configuration settings loaded from appsettings.json
/// </summary>
public class JwtSettings
{
    // symmetric key for signing tokens
    public string Secret { get; set; } = string.Empty;
    // issuer value used when validating tokens
    public string Issuer { get; set; } = string.Empty;
    // audience value matched by clients
    public string Audience { get; set; } = string.Empty;
    // minutes until token expires
    public int ExpiryMinutes { get; set; } = 60;
}
