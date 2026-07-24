using OrderChina.Shared.Domain.Auth;
using OrderChina.Shared.Domain.Identity;

namespace OrderChina.Shared.Application.Auth;

public record AccessTokenResult(string Token, DateTime ExpiresAtUtc, string Jti);

public record NewRefreshToken(string RawToken, RefreshToken Entity);

public interface ITokenService
{
    AccessTokenResult CreateAccessToken(ApplicationUser user, TokenAudience audience, IReadOnlyCollection<string> permissionCodes);

    NewRefreshToken CreateRefreshToken(Guid userId, TokenAudience audience, string securityStamp, string? createdByIp);

    string ComputeTokenHash(string rawToken);
}
