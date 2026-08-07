namespace OrderChina.Shared.Domain.Orders;

/// <summary>
/// 1 sản phẩm trong giỏ hàng tạm, thuộc 1 <see cref="OrderShopTemp"/> — cùng hình dạng dữ liệu với
/// <see cref="MainOrderProduct"/> (ImageUrl/ProductLink/ProductName/Attributes/UnitPriceCny/Quantity/Note)
/// để khi chốt đơn map thẳng 1-1 sang MainOrderProduct.
/// </summary>
public class ProductTemp
{
    public Guid Id { get; set; }

    public Guid OrderShopTempId { get; set; }

    public string? ImageUrl { get; set; }

    public string? ProductLink { get; set; }

    public string ProductName { get; set; } = string.Empty;

    /// <summary>Thuộc tính đã chọn (màu, size...) — khách/extension chọn sẵn trên trang Taobao/1688.</summary>
    public string? Attributes { get; set; }

    public decimal UnitPriceCny { get; set; }

    public int Quantity { get; set; } = 1;

    public string? Note { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
