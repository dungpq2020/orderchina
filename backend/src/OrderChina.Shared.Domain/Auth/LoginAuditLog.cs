namespace OrderChina.Shared.Domain.Auth;

/// <summary>
/// Ghi mọi lần đăng nhập (thành công/thất bại) phục vụ điều tra bảo mật, độc lập với log file.
/// </summary>
public class LoginAuditLog
{
    public Guid Id { get; set; }

    public Guid? UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public bool Succeeded { get; set; }
    public string? FailureReason { get; set; }

    public TokenAudience Audience { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
