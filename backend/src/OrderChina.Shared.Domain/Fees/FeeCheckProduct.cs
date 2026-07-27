namespace OrderChina.Shared.Domain.Fees;

/// <summary>
/// Bậc phí kiểm hàng theo số lượng sản phẩm, tách riêng theo bậc giá (dưới/trên 10 NDT).
/// </summary>
public class FeeCheckProduct
{
    public Guid Id { get; set; }

    public FeeCheckProductPriceTier PriceTier { get; set; }

    public int QuantityFrom { get; set; }

    public int QuantityTo { get; set; }

    public decimal Price { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Guid? CreatedByUserId { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public Guid? UpdatedByUserId { get; set; }
}
