namespace OrderChina.Shared.Domain.Fees;

/// <summary>
/// Cấu hình hệ thống dùng chung toàn app — CHỈ có đúng 1 bản ghi duy nhất (seed sẵn qua Migrator),
/// không Thêm/Xoá, chỉ Cập nhật giá trị.
/// </summary>
public class SystemConfig
{
    public Guid Id { get; set; }

    public string WebsiteName { get; set; } = string.Empty;

    public string? Address { get; set; }

    public string? PhoneNumber { get; set; }

    public string? ContactEmail { get; set; }

    /// <summary>Đường dẫn tới tiện ích/công cụ hỗ trợ trên Chrome.</summary>
    public string? ChromeToolUrl { get; set; }

    public decimal PurchaseExchangeRate { get; set; }

    public decimal ConsignmentExchangeRate { get; set; }

    public decimal PaymentExchangeRate { get; set; }

    public decimal MinPurchaseFee { get; set; }

    public decimal PurchaseInsurancePercent { get; set; }

    public int MaxLinksPerOrder { get; set; }

    public int CartAutoDeleteDays { get; set; }

    public decimal SalesCommissionPurchasePercent { get; set; }

    public decimal PurchasingStaffCommissionPurchasePercent { get; set; }

    public decimal SalesCommissionConsignmentPercent { get; set; }

    public decimal SalesCommissionPaymentPercent { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Guid? CreatedByUserId { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public Guid? UpdatedByUserId { get; set; }
}
