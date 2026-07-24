using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace OrderChina.Shared.Infrastructure.Auth;

public static class JwtAuthenticationExtensions
{
    /// <summary>
    /// Đăng ký JWT bearer auth với issuer chung nhưng audience riêng cho từng API
    /// (audience = "orderchina-admin-api" hoặc "orderchina-customer-api") — token cấp bởi
    /// một API sẽ không được API còn lại chấp nhận dù ký cùng cặp khóa RSA.
    /// Ký bất đối xứng RS256 (không HMAC symmetric secret) để sau này có thể tách 1 service phát hành
    /// token riêng, các API khác chỉ cần giữ public key để validate.
    /// </summary>
    public static IServiceCollection AddOrderChinaJwtAuthentication(
        this IServiceCollection services,
        IConfiguration configuration,
        string audience)
    {
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.AddSingleton<IJwtSigningKeyProvider, JwtSigningKeyProvider>();

        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, _ => { });

        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IJwtSigningKeyProvider, IOptions<JwtSettings>>((options, keyProvider, jwtSettings) =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtSettings.Value.Issuer,
                    ValidateAudience = true,
                    ValidAudience = audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = keyProvider.GetKey(),
                    // Chống algorithm-confusion attack: chỉ chấp nhận đúng RS256, không cho token tự khai "alg" khác.
                    ValidAlgorithms = new[] { SecurityAlgorithms.RsaSha256 },
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1)
                };
                // Đọc claim đúng tên gốc trong token (vd "sub", "perm") thay vì bị JwtSecurityTokenHandler
                // tự map sang các URI dài của ClaimTypes — giúp code đọc claim dễ đoán và nhất quán.
                options.MapInboundClaims = false;
            });

        services.AddAuthorization();

        return services;
    }
}
