namespace OrderChina.Shared.Domain.Orders;

/// <summary>
/// 1 dòng lịch sử thanh toán của 1 đơn hàng (đặt cọc/thanh toán) — riêng với <see cref="Wallets.WalletTransaction"/>
/// (sổ cái toàn hệ thống theo user); bảng này gắn theo đơn, dùng cho trang chi tiết đơn hàng quản lý.
/// </summary>
public class MainOrderPaymentHistory
{
    public Guid Id { get; set; }

    public Guid MainOrderId { get; set; }

    public MainOrderPaymentType Type { get; set; }

    public MainOrderPaymentMethod Method { get; set; }

    public decimal Amount { get; set; }

    public Guid PerformedByUserId { get; set; }

    public DateTime PaidAtUtc { get; set; } = DateTime.UtcNow;
}
