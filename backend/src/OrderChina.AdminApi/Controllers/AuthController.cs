using System.IdentityModel.Tokens.Jwt;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Hosting;
using OrderChina.Shared.Application.Auth;
using OrderChina.Shared.Application.Auth.Dtos;
using OrderChina.Shared.Domain.Auth;

namespace OrderChina.AdminApi.Controllers;

/// <summary>
/// Auth cho tài khoản Staff (nhân viên nội bộ). KHÔNG có endpoint /register —
/// tài khoản Staff chỉ được tạo bởi Admin khác hoặc seed, không tự đăng ký.
/// </summary>
[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private const string RefreshCookieName = "oc_admin_rt";

    private readonly IAuthService _authService;
    private readonly IValidator<LoginRequest> _loginValidator;
    private readonly IHostEnvironment _environment;

    public AuthController(IAuthService authService, IValidator<LoginRequest> loginValidator, IHostEnvironment environment)
    {
        _authService = authService;
        _loginValidator = loginValidator;
        _environment = environment;
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto, CancellationToken cancellationToken)
    {
        var request = new LoginRequest(dto.Username, dto.Password, dto.TwoFactorCode, GetClientIp(), Request.Headers.UserAgent.ToString());

        var validation = await _loginValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));
        }

        var result = await _authService.LoginAsync(request, TokenAudience.AdminApi, cancellationToken);

        if (!result.Succeeded || result.Tokens is null)
        {
            return result.IsLockedOut || result.RequiresTwoFactor
                ? StatusCode(StatusCodes.Status423Locked, new { error = result.Error, requiresTwoFactor = result.RequiresTwoFactor })
                : Unauthorized(new { error = result.Error });
        }

        SetRefreshCookie(result.Tokens.RefreshToken, result.Tokens.RefreshTokenExpiresAtUtc);

        return Ok(new { accessToken = result.Tokens.AccessToken, expiresAtUtc = result.Tokens.AccessTokenExpiresAtUtc });
    }

    [HttpPost("refresh")]
    [EnableRateLimiting("auth")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh(CancellationToken cancellationToken)
    {
        if (!Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken) || string.IsNullOrWhiteSpace(refreshToken))
        {
            return Unauthorized(new { error = "Thiếu refresh token." });
        }

        var result = await _authService.RefreshAsync(new RefreshRequest(refreshToken, GetClientIp()), TokenAudience.AdminApi, cancellationToken);

        if (!result.Succeeded || result.Tokens is null)
        {
            Response.Cookies.Delete(RefreshCookieName, new CookieOptions { Path = CookiePath });
            return Unauthorized(new { error = result.Error });
        }

        SetRefreshCookie(result.Tokens.RefreshToken, result.Tokens.RefreshTokenExpiresAtUtc);

        return Ok(new { accessToken = result.Tokens.AccessToken, expiresAtUtc = result.Tokens.AccessTokenExpiresAtUtc });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        if (Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken) && !string.IsNullOrWhiteSpace(refreshToken))
        {
            await _authService.LogoutAsync(refreshToken, TokenAudience.AdminApi, cancellationToken);
        }

        Response.Cookies.Delete(RefreshCookieName, new CookieOptions { Path = CookiePath });
        return NoContent();
    }

    [HttpPost("revoke-all")]
    [Authorize]
    public async Task<IActionResult> RevokeAll(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _authService.RevokeAllSessionsAsync(userId, "user_requested", cancellationToken);
        Response.Cookies.Delete(RefreshCookieName, new CookieOptions { Path = CookiePath });
        return NoContent();
    }

    [HttpPost("2fa/enable")]
    [Authorize]
    public async Task<IActionResult> EnableTwoFactor(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var response = await _authService.EnableTwoFactorAsync(userId, cancellationToken);
        return Ok(response);
    }

    [HttpPost("2fa/verify")]
    [Authorize]
    public async Task<IActionResult> VerifyTwoFactor([FromBody] VerifyTwoFactorDto dto, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var isValid = await _authService.VerifyTwoFactorAsync(new Verify2faRequest(userId, dto.Code), cancellationToken);
        return isValid ? NoContent() : BadRequest(new { error = "Mã xác thực không đúng." });
    }

    /// <summary>
    /// Ghép Request.PathBase (rỗng ở dev chạy trực tiếp; "/admin/api" khi host chung 1 domain
    /// sau Nginx — xem Program.cs UsePathBase) để cookie Path luôn khớp đúng URL public thật sự,
    /// không hardcode "/auth".
    /// </summary>
    private string CookiePath => Request.PathBase + "/auth";

    private void SetRefreshCookie(string refreshToken, DateTime expiresAtUtc)
    {
        Response.Cookies.Append(RefreshCookieName, refreshToken, new CookieOptions
        {
            HttpOnly = true,
            // Secure=true bắt buộc browser chỉ gửi cookie qua HTTPS — production luôn chạy HTTPS nên
            // giữ true, nhưng local dev chạy http://localhost thường (không phải luôn được trình duyệt
            // coi là "trustworthy origin" nhất quán giữa các browser/chế độ ẩn danh), khiến cookie set
            // xong bị âm thầm không lưu → /auth/refresh sau đó luôn thất bại dù vừa đăng nhập thành công.
            Secure = !_environment.IsDevelopment(),
            SameSite = SameSiteMode.Strict,
            Path = CookiePath,
            Expires = expiresAtUtc
        });
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new InvalidOperationException("Missing sub claim.");
        return Guid.Parse(sub);
    }

    private string? GetClientIp() => HttpContext.Connection.RemoteIpAddress?.ToString();
}

public record LoginRequestDto(string Username, string Password, string? TwoFactorCode);

public record VerifyTwoFactorDto(string Code);
