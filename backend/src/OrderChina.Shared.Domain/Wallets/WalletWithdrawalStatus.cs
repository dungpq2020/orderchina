namespace OrderChina.Shared.Domain.Wallets;

public enum WalletWithdrawalStatus
{
    /// <summary>Chờ duyệt — chưa trừ tiền khỏi ví.</summary>
    Pending = 1,

    /// <summary>Đã duyệt — đã trừ tiền khỏi ví.</summary>
    Approved = 2
}
