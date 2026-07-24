using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace OrderChina.Shared.Infrastructure.Auth;

public interface IJwtSigningKeyProvider
{
    RsaSecurityKey GetKey();
    SigningCredentials GetSigningCredentials();
}

/// <summary>
/// Nạp cặp khóa RSA ký JWT (RS256) từ biến môi trường. KHÔNG dùng HMAC symmetric secret —
/// bất đối xứng cho phép sau này tách 1 service phát hành token riêng, các API khác chỉ giữ public key.
/// Ở Development nếu thiếu cấu hình sẽ tự sinh khóa ephemeral (mất hiệu lực mỗi lần restart) kèm cảnh báo rõ ràng;
/// ngoài Development bắt buộc phải cấu hình, nếu không sẽ throw khi khởi động.
/// </summary>
public class JwtSigningKeyProvider : IJwtSigningKeyProvider
{
    private readonly RSAParameters _parameters;

    public JwtSigningKeyProvider(IOptions<JwtSettings> options, IHostEnvironment environment, ILogger<JwtSigningKeyProvider> logger)
    {
        using var rsa = RSA.Create();

        var privateKeyBase64 = options.Value.RsaPrivateKeyBase64;
        if (!string.IsNullOrWhiteSpace(privateKeyBase64))
        {
            rsa.ImportRSAPrivateKey(Convert.FromBase64String(privateKeyBase64), out _);
        }
        else if (environment.IsDevelopment())
        {
            logger.LogWarning(
                "Jwt:RsaPrivateKeyBase64 chưa được cấu hình — đang dùng khóa RSA EPHEMERAL chỉ dành cho DEV. " +
                "Toàn bộ access token/refresh token sẽ mất hiệu lực mỗi lần restart ứng dụng. " +
                "KHÔNG được để trống ở môi trường staging/production.");
            rsa.KeySize = 2048;
        }
        else
        {
            throw new InvalidOperationException(
                "Jwt:RsaPrivateKeyBase64 bắt buộc phải được cấu hình ngoài môi trường Development.");
        }

        _parameters = rsa.ExportParameters(includePrivateParameters: true);
    }

    public RsaSecurityKey GetKey()
    {
        var rsa = RSA.Create();
        rsa.ImportParameters(_parameters);
        return new RsaSecurityKey(rsa);
    }

    public SigningCredentials GetSigningCredentials() => new(GetKey(), SecurityAlgorithms.RsaSha256);
}
