using OrderChina.Shared.Application.Auth.Dtos;
using OrderChina.Shared.Domain.Auth;

namespace OrderChina.Shared.Application.Auth;

public interface IAuthService
{
    Task<AuthResult> LoginAsync(LoginRequest request, TokenAudience audience, CancellationToken cancellationToken = default);

    Task<AuthResult> RefreshAsync(RefreshRequest request, TokenAudience audience, CancellationToken cancellationToken = default);

    Task LogoutAsync(string refreshToken, TokenAudience audience, CancellationToken cancellationToken = default);

    Task RevokeAllSessionsAsync(Guid userId, string reason, CancellationToken cancellationToken = default);

    Task<AuthResult> RegisterCustomerAsync(RegisterCustomerRequest request, CancellationToken cancellationToken = default);

    Task<Enable2faResponse> EnableTwoFactorAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<bool> VerifyTwoFactorAsync(Verify2faRequest request, CancellationToken cancellationToken = default);
}
