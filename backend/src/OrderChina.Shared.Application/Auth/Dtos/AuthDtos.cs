namespace OrderChina.Shared.Application.Auth.Dtos;

public record LoginRequest(string Username, string Password, string? TwoFactorCode, string? IpAddress, string? UserAgent);

public record RegisterCustomerRequest(string Username, string Email, string Password, string FullName, string PhoneNumber, string? IpAddress);

public record RefreshRequest(string RefreshToken, string? IpAddress);

public record ChangePasswordRequest(Guid UserId, string NewPassword);

public record TokenResponse(string AccessToken, DateTime AccessTokenExpiresAtUtc, string RefreshToken, DateTime RefreshTokenExpiresAtUtc);

public record AuthResult(bool Succeeded, TokenResponse? Tokens, string? Error, bool IsLockedOut = false, bool RequiresTwoFactor = false);

public record Enable2faResponse(string SharedKey, string AuthenticatorUri);

public record Verify2faRequest(Guid UserId, string Code);
