namespace OrderChina.Shared.Domain.Fees;

/// <summary>
/// Bậc phí vận chuyển TQ-VN theo khoảng cân nặng, gắn với 1 tuyến (kho đi -&gt; kho đến) và
/// 1 hình thức vận chuyển cụ thể. FromWarehouseId/ToWarehouseId/ShippingMethodId lưu thô Guid
/// (không khai báo navigation/FK constraint), theo đúng convention hiện tại của ApplicationUser.
/// </summary>
public class FeeWeight
{
    public Guid Id { get; set; }

    public FeeOrderType OrderType { get; set; }

    public Guid FromWarehouseId { get; set; }

    public Guid ToWarehouseId { get; set; }

    public decimal WeightFrom { get; set; }

    public decimal WeightTo { get; set; }

    public decimal Price { get; set; }

    public Guid ShippingMethodId { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Guid? CreatedByUserId { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public Guid? UpdatedByUserId { get; set; }
}
