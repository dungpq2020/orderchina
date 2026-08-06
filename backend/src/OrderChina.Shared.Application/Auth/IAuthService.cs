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

    /// <summary>
    /// Tự đổi mật khẩu — chỉ cần đang đăng nhập hợp lệ (JWT [Authorize]), không yêu cầu nhập lại mật khẩu
    /// cũ. Trả về token mới cho phiên hiện tại vì đổi mật khẩu làm SecurityStamp đổi theo, khiến mọi
    /// refresh token cũ (kể cả của phiên đang gọi API này) mismatch ở lần /auth/refresh kế tiếp — không
    /// cấp lại thì người dùng bị đăng xuất oan ngay sau khi vừa đổi mật khẩu thành công. Các thiết
    /// bị/tab khác vẫn bị đăng xuất tự nhiên như mong muốn.
    /// </summary>
    Task<AuthResult> ChangePasswordAsync(ChangePasswordRequest request, TokenAudience audience, string? ipAddress, CancellationToken cancellationToken = default);

    Task<Enable2faResponse> EnableTwoFactorAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<bool> VerifyTwoFactorAsync(Verify2faRequest request, CancellationToken cancellationToken = default);
}
