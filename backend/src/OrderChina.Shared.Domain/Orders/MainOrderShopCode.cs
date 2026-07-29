namespace OrderChina.Shared.Domain.Orders;

/// <summary>
/// 1 mã đơn hàng bên shop Trung Quốc (Taobao/1688...) gắn với <see cref="MainOrder"/> — 1 đơn mua hộ
/// có thể gộp hàng từ nhiều shop khác nhau, mỗi shop có 1 mã đơn riêng bên phía họ.
/// </summary>
public class MainOrderShopCode
{
    public Guid Id { get; set; }

    public Guid MainOrderId { get; set; }

    public string Code { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Guid CreatedByUserId { get; set; }
}
