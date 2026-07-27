namespace OrderChina.Shared.Domain.Wallets;

/// <summary>
/// 1 dòng lịch sử thay đổi số dư ví — sinh ra mỗi khi có giao dịch tác động tới WalletBalance
/// (hiện tại chỉ có Recharge; ReferenceId trỏ tới WalletRecharge.Id tương ứng).
/// </summary>
public class WalletTransaction
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    /// <summary>Số tiền thay đổi — dương nếu cộng vào ví, âm nếu trừ.</summary>
    public decimal Amount { get; set; }

    /// <summary>Số dư ví SAU khi áp dụng giao dịch này — snapshot để tra soát không cần tính lại từ đầu.</summary>
    public decimal BalanceAfter { get; set; }

    public WalletTransactionType Type { get; set; }

    public Guid? ReferenceId { get; set; }

    public string? Description { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Guid CreatedByUserId { get; set; }
}
