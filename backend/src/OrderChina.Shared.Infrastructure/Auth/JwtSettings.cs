namespace OrderChina.Shared.Infrastructure.Auth;

public class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = string.Empty;

    /// <summary>
    /// RSA private key (PKCS#1) đã encode base64, nạp qua biến môi trường Jwt__RsaPrivateKeyBase64.
    /// Bắt buộc ngoài môi trường Development — không hardcode trong appsettings.
    /// </summary>
    public string? RsaPrivateKeyBase64 { get; set; }

    public int AccessTokenLifetimeMinutes { get; set; } = 15;

    public int RefreshTokenLifetimeDays { get; set; } = 14;
}
