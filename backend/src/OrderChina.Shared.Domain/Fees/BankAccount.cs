namespace OrderChina.Shared.Domain.Fees;

/// <summary>
/// Tài khoản ngân hàng của công ty — hiển thị cho khách hàng chuyển khoản nạp tiền vào ví.
/// </summary>
public class BankAccount
{
    public Guid Id { get; set; }

    public string BankName { get; set; } = string.Empty;

    public string AccountNumber { get; set; } = string.Empty;

    public string AccountHolderName { get; set; } = string.Empty;

    public string? Branch { get; set; }

    public string? QrCodeUrl { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Guid? CreatedByUserId { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public Guid? UpdatedByUserId { get; set; }
}
