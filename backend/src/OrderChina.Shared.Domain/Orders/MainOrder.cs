using OrderChina.Shared.Domain.Fees;

namespace OrderChina.Shared.Domain.Orders;

/// <summary>
/// Đơn hàng cha (mua hộ / ký gửi / thanh toán hộ...) — gắn 1 khách hàng, chứa nhiều <see cref="MainOrderProduct"/>.
/// Các khoản phí ship TQ / phí vận chuyển VN chưa xác định lúc tạo đơn (=0), được cập nhật ở các luồng xử lý sau
/// (nhập phí ship TQ thủ công, gắn mã vận đơn để tính phí vận chuyển theo FeeWeight).
/// </summary>
public class MainOrder
{
    public Guid Id { get; set; }

    /// <summary>Mã đơn hiển thị cho khách/staff — sinh từ <see cref="OrderNumber"/>, ví dụ "MH000123".</summary>
    public string OrderCode { get; set; } = string.Empty;

    /// <summary>Số thứ tự tăng dần (Postgres identity) — nguồn sinh <see cref="OrderCode"/>.</summary>
    public long OrderNumber { get; set; }

    public Guid UserId { get; set; }

    public FeeOrderType OrderType { get; set; } = FeeOrderType.PurchaseOnBehalf;

    /// <summary>Đơn tạo qua extension hay staff tạo thủ công — quyết định trạng thái khởi tạo (xem <see cref="MainOrderCreationType"/>).</summary>
    public MainOrderCreationType CreationType { get; set; } = MainOrderCreationType.Manual;

    /// <summary>Kho nhận hàng ở Trung Quốc — cần để sau này tra <c>FeeWeight</c> tính phí vận chuyển theo tuyến.</summary>
    public Guid? ChinaWarehouseId { get; set; }

    /// <summary>Kho giao hàng ở Việt Nam — cùng mục đích với <see cref="ChinaWarehouseId"/>.</summary>
    public Guid? VietnamWarehouseId { get; set; }

    public Guid? ShippingMethodId { get; set; }

    /// <summary>Nhân viên đặt hàng phụ trách đơn này — mặc định lấy từ hồ sơ khách lúc tạo đơn, sửa được sau.</summary>
    public Guid? OrderStaffId { get; set; }

    /// <summary>Nhân viên kinh doanh phụ trách đơn này — cùng mục đích với <see cref="OrderStaffId"/>.</summary>
    public Guid? SalesStaffId { get; set; }

    /// <summary>Tỉ giá áp dụng tại thời điểm tạo đơn (lưu lại để tra soát, không đổi theo config sau này).</summary>
    public decimal ExchangeRateApplied { get; set; }

    /// <summary>Tiền hàng quy đổi VNĐ = Σ(giá ¥ × số lượng) × tỉ giá áp dụng.</summary>
    public decimal ProductAmount { get; set; }

    /// <summary>Phần trăm phí mua hàng thực áp dụng (ưu tiên riêng khách &gt; bậc mặc định FeeBuyPro).</summary>
    public decimal PurchaseFeePercentApplied { get; set; }

    /// <summary>Phí mua hàng VNĐ (đã áp chiết khấu theo cấp độ khách hàng và mức tối thiểu SystemConfig).</summary>
    public decimal PurchaseFeeAmount { get; set; }

    /// <summary>Phí ship nội địa Trung Quốc — chưa xác định lúc tạo đơn, nhập tay sau.</summary>
    public decimal ShippingFeeCn { get; set; }

    /// <summary>Phí vận chuyển TQ-VN — chỉ tính được khi đơn đã gắn mã vận đơn (FeeWeight theo cân nặng thực tế).</summary>
    public decimal ShippingFeeVn { get; set; }

    /// <summary>Dịch vụ đóng gỗ — chưa có bảng phí cấu hình, chỉ lưu cờ yêu cầu, phí nhập tay sau.</summary>
    public bool RequestPackaging { get; set; }

    public bool RequestInsurance { get; set; }

    /// <summary>Phí bảo hiểm = ProductAmount × SystemConfig.PurchaseInsurancePercent (chỉ tính khi RequestInsurance).</summary>
    public decimal InsuranceFeeAmount { get; set; }

    public bool RequestCheckProduct { get; set; }

    /// <summary>Phí kiểm hàng — tra theo bậc FeeCheckProduct (giá ¥ dưới/trên 10 tệ × số lượng từng dòng sản phẩm).</summary>
    public decimal CheckProductFeeAmount { get; set; }

    /// <summary>Dịch vụ giao hàng tận nơi — chưa có bảng phí cấu hình, chỉ lưu cờ yêu cầu, phí nhập tay sau.</summary>
    public bool RequestHomeDelivery { get; set; }

    /// <summary>Tổng tiền đơn = ProductAmount + PurchaseFeeAmount + ShippingFeeCn + ShippingFeeVn + InsuranceFeeAmount + CheckProductFeeAmount.</summary>
    public decimal TotalAmount { get; set; }

    /// <summary>Phần trăm cọc tối thiểu áp dụng — lấy theo UserLevel.MinDepositPercent của khách (theo Tier).</summary>
    public decimal MinDepositPercentApplied { get; set; }

    /// <summary>Số tiền khách phải đặt cọc = TotalAmount × MinDepositPercentApplied.</summary>
    public decimal DepositAmount { get; set; }

    public MainOrderStatus Status { get; set; } = MainOrderStatus.AwaitingQuote;

    // Mỗi trạng thái có mốc thời gian riêng để hiển thị TimeLine — null nghĩa là đơn chưa tới trạng thái đó.
    // AwaitingQuote dùng luôn CreatedAtUtc (luôn là trạng thái khởi tạo của đơn Manual) nên không cần cột riêng.

    /// <summary>Chờ đặt cọc — đơn Extension dùng CreatedAtUtc (khởi tạo thẳng ở đây); đơn Manual dùng cột này (lúc bấm "Đã báo giá").</summary>
    public DateTime? AwaitingDepositAtUtc { get; set; }

    public DateTime? DepositedAtUtc { get; set; }

    public DateTime? PurchasedAtUtc { get; set; }

    public DateTime? AwaitingShopShipmentAtUtc { get; set; }

    public DateTime? ShopShippedAtUtc { get; set; }

    public DateTime? ArrivedChinaWarehouseAtUtc { get; set; }

    public DateTime? InTransitToVietnamAtUtc { get; set; }

    public DateTime? ArrivedVietnamWarehouseAtUtc { get; set; }

    public DateTime? PaidAtUtc { get; set; }

    public DateTime? CompletedAtUtc { get; set; }

    public DateTime? ComplaintAtUtc { get; set; }

    public DateTime? CancelledAtUtc { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Guid CreatedByUserId { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public Guid? UpdatedByUserId { get; set; }

    public List<MainOrderProduct> Products { get; set; } = new();
}
