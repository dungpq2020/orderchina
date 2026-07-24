using OrderChina.Shared.Domain.Identity;

namespace OrderChina.Shared.Domain.Auth;

/// <summary>
/// Refresh token opaque (256-bit random), CHỈ hash SHA-256 được lưu ở đây, không bao giờ lưu token gốc.
/// Rotation: mỗi lần refresh, token hiện tại bị revoke và ReplacedByTokenHash trỏ tới token mới.
/// Reuse detection: nếu 1 token đã Revoked lại được gửi lên, coi là bị đánh cắp → revoke toàn bộ family của user.
/// </summary>
public class RefreshToken
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public string TokenHash { get; set; } = string.Empty;

    public TokenAudience Audience { get; set; }

    /// <summary>
    /// SecurityStamp của user tại thời điểm token này được cấp — so lại với SecurityStamp hiện tại
    /// của user lúc refresh để phát hiện đổi mật khẩu/khoá tài khoản/revoke-all mà không cần
    /// check mỗi request (access token sống ngắn nên chấp nhận độ trễ phát hiện).
    /// </summary>
    public string SecurityStampAtIssuance { get; set; } = string.Empty;

    public DateTime ExpiresAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? CreatedByIp { get; set; }

    public DateTime? RevokedAtUtc { get; set; }
    public string? ReplacedByTokenHash { get; set; }
    public string? ReasonRevoked { get; set; }

    public bool IsActive => RevokedAtUtc is null && ExpiresAtUtc > DateTime.UtcNow;
}
