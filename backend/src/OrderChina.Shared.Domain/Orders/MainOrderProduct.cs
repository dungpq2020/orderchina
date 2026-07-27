namespace OrderChina.Shared.Domain.Orders;

/// <summary>1 dòng sản phẩm trong <see cref="MainOrder"/> — giá nhập theo ¥ (nhân dân tệ).</summary>
public class MainOrderProduct
{
    public Guid Id { get; set; }

    public Guid MainOrderId { get; set; }

    public string? ImageUrl { get; set; }

    public string? ProductLink { get; set; }

    public string ProductName { get; set; } = string.Empty;

    /// <summary>Thuộc tính sản phẩm (màu, size...) — nhập tự do dạng text.</summary>
    public string? Attributes { get; set; }

    public decimal UnitPriceCny { get; set; }

    public int Quantity { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
