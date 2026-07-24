using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using OrderChina.Shared.Application.Auth;
using OrderChina.Shared.Domain.Auth;
using OrderChina.Shared.Domain.Identity;

namespace OrderChina.Shared.Infrastructure.Auth;

public class TokenService : ITokenService
{
    private readonly IJwtSigningKeyProvider _signingKeyProvider;
    private readonly JwtSettings _jwtSettings;

    public TokenService(IJwtSigningKeyProvider signingKeyProvider, IOptions<JwtSettings> jwtSettings)
    {
        _signingKeyProvider = signingKeyProvider;
        _jwtSettings = jwtSettings.Value;
    }

    public AccessTokenResult CreateAccessToken(ApplicationUser user, TokenAudience audience, IReadOnlyCollection<string> permissionCodes)
    {
        var jti = Guid.NewGuid().ToString("N");
        var now = DateTime.UtcNow;
        var expiresAtUtc = now.AddMinutes(_jwtSettings.AccessTokenLifetimeMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, jti),
            new("user_type", user.UserType.ToString()),
            new("security_stamp", user.SecurityStamp ?? string.Empty)
        };

        claims.AddRange(permissionCodes.Select(code => new Claim("perm", code)));

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: ToAudienceValue(audience),
            claims: claims,
            notBefore: now,
            expires: expiresAtUtc,
            signingCredentials: _signingKeyProvider.GetSigningCredentials());

        var handler = new JwtSecurityTokenHandler();
        return new AccessTokenResult(handler.WriteToken(token), expiresAtUtc, jti);
    }

    public NewRefreshToken CreateRefreshToken(Guid userId, TokenAudience audience, string securityStamp, string? createdByIp)
    {
        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

        var entity = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TokenHash = ComputeTokenHash(rawToken),
            Audience = audience,
            SecurityStampAtIssuance = securityStamp,
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenLifetimeDays),
            CreatedByIp = createdByIp
        };

        return new NewRefreshToken(rawToken, entity);
    }

    public string ComputeTokenHash(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes);
    }

    private static string ToAudienceValue(TokenAudience audience) => audience switch
    {
        TokenAudience.AdminApi => "orderchina-admin-api",
        TokenAudience.CustomerApi => "orderchina-customer-api",
        _ => throw new ArgumentOutOfRangeException(nameof(audience))
    };
}
