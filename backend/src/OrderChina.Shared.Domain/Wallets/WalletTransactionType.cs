namespace OrderChina.Shared.Domain.Wallets;

public enum WalletTransactionType
{
    /// <summary>Nạp tiền vào ví — cộng (+).</summary>
    Recharge = 1,

    /// <summary>Rút tiền khỏi ví — trừ (-).</summary>
    Withdrawal = 2,

    /// <summary>Đặt cọc đơn mua hộ/ký gửi — trừ (-).</summary>
    OrderDeposit = 3,

    /// <summary>Thanh toán đơn hàng — trừ (-).</summary>
    OrderPayment = 4,

    /// <summary>Hoàn tiền do huỷ đơn — cộng (+).</summary>
    OrderCancelRefund = 5
}
