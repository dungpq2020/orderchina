namespace OrderChina.Shared.Domain.Fees;

/// <summary>
/// Bậc phí dịch vụ mua hàng theo giá trị đơn hàng — [PriceFrom, PriceTo) áp dụng mức Percent tương ứng.
/// </summary>
public class FeeBuyPro
{
    public Guid Id { get; set; }

    public decimal PriceFrom { get; set; }

    public decimal PriceTo { get; set; }

    public decimal Percent { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Guid? CreatedByUserId { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public Guid? UpdatedByUserId { get; set; }
}
