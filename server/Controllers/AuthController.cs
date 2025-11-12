using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using server.Services;

namespace server.Controllers;

/// <summary>
/// Authentication controller - handles user login and registration
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        // store service so actions can call shared auth logic
        _authService = authService;
    }

    /// <summary>
    /// Login endpoint - authenticates user and returns JWT token
    /// </summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        // ask service to check credentials and build response
        var result = await _authService.LoginAsync(request);
        if (!result.Success)
        {
            // send 401 when login fails so client knows to retry
            return Unauthorized(result);
        }
        // success goes out with user data and token
        return Ok(result);
    }

    /// <summary>
    /// Register endpoint - creates new user account and returns JWT token
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        // ask service to create user and build result package
        var result = await _authService.RegisterAsync(request);
        if (!result.Success)
        {
            // report validation issues plainly for caller
            return BadRequest(result);
        }
        // new user returns with token ready to use
        return Ok(result);
    }
}
