namespace OrderChina.Shared.Domain.Wallets;

/// <summary>
/// 1 lần Staff tạo yêu cầu rút tiền khỏi ví khách hàng, chuyển vào tài khoản ngân hàng CỦA KHÁCH
/// (không phải bank_accounts công ty — nên lưu thô thông tin ngân hàng nhận, không tham chiếu bảng nào).
/// Status=Approved mới thực sự trừ tiền khỏi ví (ngay khi tạo, hoặc khi duyệt 1 yêu cầu Pending sau đó).
/// </summary>
public class WalletWithdrawal
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public decimal Amount { get; set; }

    public string? BankName { get; set; }

    public string? BankAccountNumber { get; set; }

    public string? BankAccountHolderName { get; set; }

    public string? Note { get; set; }

    public WalletWithdrawalStatus Status { get; set; } = WalletWithdrawalStatus.Approved;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Guid CreatedByUserId { get; set; }

    /// <summary>Thời điểm chuyển sang Approved (trừ tiền khỏi ví) — null nếu còn đang Pending.</summary>
    public DateTime? ApprovedAtUtc { get; set; }

    public Guid? ApprovedByUserId { get; set; }
}
