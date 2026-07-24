using Microsoft.AspNetCore.Identity;

namespace OrderChina.Shared.Domain.Identity;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;

    public UserType UserType { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Bắt buộc 2FA áp dụng cho tài khoản này. Mặc định false ở Phase 1 (optional);
    /// bật ép buộc cho Staff qua cấu hình Auth:RequireTwoFactorForStaff khi seed/nâng cấp tài khoản.
    /// </summary>
    public bool RequireTwoFactor { get; set; }
}
