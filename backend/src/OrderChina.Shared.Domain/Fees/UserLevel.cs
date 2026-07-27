namespace OrderChina.Shared.Domain.Fees;

/// <summary>
/// Cấp độ ưu đãi khách hàng theo tích luỹ — cố định 5 bậc (Đồng &lt; Bạc &lt; Vàng &lt; Kim Cương &lt; Tinh Anh),
/// Rank tăng dần theo thứ tự này, chỉ Cập nhật giá trị chứ không Thêm/Xoá bậc.
/// </summary>
public class UserLevel
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    /// <summary>Thứ tự bậc, tăng dần từ thấp đến cao (1 = Đồng ... 5 = Tinh Anh).</summary>
    public int Rank { get; set; }

    public decimal PurchaseFeeDiscountPercent { get; set; }

    public decimal ShippingFeeDiscountPercent { get; set; }

    public decimal MinDepositPercent { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Guid? CreatedByUserId { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public Guid? UpdatedByUserId { get; set; }
}
