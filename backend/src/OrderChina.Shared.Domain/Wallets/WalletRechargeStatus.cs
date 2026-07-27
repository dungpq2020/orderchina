namespace OrderChina.Shared.Domain.Wallets;

public enum WalletRechargeStatus
{
    /// <summary>Chờ duyệt — chưa cộng tiền vào ví.</summary>
    Pending = 1,

    /// <summary>Đã duyệt — đã cộng tiền vào ví (ngay khi tạo hoặc khi duyệt sau đó).</summary>
    Approved = 2
}
