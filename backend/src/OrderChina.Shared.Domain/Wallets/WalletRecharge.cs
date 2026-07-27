namespace OrderChina.Shared.Domain.Wallets;

/// <summary>
/// 1 lần Staff nạp tiền vào ví khách hàng. Status=Approved mới thực sự cộng tiền vào ví (ngay khi tạo,
/// hoặc khi 1 yêu cầu Pending được duyệt sau đó) — mỗi lần cộng tiền sinh thêm 1 dòng WalletTransaction.
/// </summary>
public class WalletRecharge
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    /// <summary>Tài khoản ngân hàng công ty nhận tiền chuyển khoản — lưu thô Guid, không khai báo FK constraint.</summary>
    public Guid? BankAccountId { get; set; }

    public decimal Amount { get; set; }

    public string? Note { get; set; }

    public WalletRechargeStatus Status { get; set; } = WalletRechargeStatus.Approved;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Guid CreatedByUserId { get; set; }

    /// <summary>Thời điểm chuyển sang Approved (cộng tiền vào ví) — null nếu còn đang Pending.</summary>
    public DateTime? ApprovedAtUtc { get; set; }

    public Guid? ApprovedByUserId { get; set; }
}
