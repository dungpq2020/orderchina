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

    /// <summary>Σ(giá ¥ × số lượng) các dòng sản phẩm — lưu sẵn (thay vì tính lại từ main_order_products mỗi lần) để truy vấn danh sách/xuất Excel không phải JOIN+SUM.</summary>
    public decimal ProductAmountCny { get; set; }

    /// <summary>Tiền hàng quy đổi VNĐ = ProductAmountCny × tỉ giá áp dụng.</summary>
    public decimal ProductAmount { get; set; }

    /// <summary>Phần trăm phí mua hàng thực áp dụng (ưu tiên riêng khách &gt; bậc mặc định FeeBuyPro).</summary>
    public decimal PurchaseFeePercentApplied { get; set; }

    /// <summary>Phí mua hàng VNĐ (đã áp chiết khấu theo cấp độ khách hàng và mức tối thiểu SystemConfig).</summary>
    public decimal PurchaseFeeAmount { get; set; }

    /// <summary>Phí ship nội địa Trung Quốc (¥) — staff nhập tay, chưa xác định lúc tạo đơn.</summary>
    public decimal ShippingFeeCnCny { get; set; }

    /// <summary>ShippingFeeCnCny × ExchangeRateApplied — lưu sẵn (không tính lại từ FE) để cộng thẳng vào TotalAmount; RecalculateTotalsAsync tự đồng bộ lại mỗi khi tỷ giá đổi.</summary>
    public decimal ShippingFeeCn { get; set; }

    /// <summary>
    /// Số tiền (¥) thực tế đã bỏ ra mua hàng ở nguồn — staff nhập tay sau khi mua thật, có thể chênh lệch
    /// so với ProductAmount báo giá cho khách (giá web/thời điểm báo giá khác giá mua thật). CHỈ dùng để
    /// tính Tiền hoa hồng (BuildDetailAsync.CommissionAmount) — KHÔNG cộng vào TotalAmount/DepositAmount
    /// của khách.
    /// </summary>
    public decimal ActualPurchaseAmountCny { get; set; }

    /// <summary>ActualPurchaseAmountCny × ExchangeRateApplied — lưu sẵn cùng lý do với ShippingFeeCn.</summary>
    public decimal ActualPurchaseAmountVnd { get; set; }

    /// <summary>Phí vận chuyển TQ-VN — chỉ tính được khi đơn đã gắn mã vận đơn (FeeWeight theo cân nặng thực tế).</summary>
    public decimal ShippingFeeVn { get; set; }

    /// <summary>Dịch vụ đóng gỗ — chưa có bảng phí cấu hình, chỉ lưu cờ yêu cầu, phí nhập tay ở trang chi tiết đơn.</summary>
    public bool RequestPackaging { get; set; }

    /// <summary>Phí đóng gỗ — nhập tay (không có bảng cấu hình theo bậc như phí mua hàng/kiểm hàng).</summary>
    public decimal PackagingFeeAmount { get; set; }

    public bool RequestInsurance { get; set; }

    /// <summary>Phí bảo hiểm = ProductAmount × SystemConfig.PurchaseInsurancePercent (chỉ tính khi RequestInsurance).</summary>
    public decimal InsuranceFeeAmount { get; set; }

    public bool RequestCheckProduct { get; set; }

    /// <summary>Phí kiểm hàng — tra theo bậc FeeCheckProduct (giá ¥ dưới/trên 10 tệ × số lượng từng dòng sản phẩm).</summary>
    public decimal CheckProductFeeAmount { get; set; }

    /// <summary>Dịch vụ giao hàng tận nơi — chưa có bảng phí cấu hình, chỉ lưu cờ yêu cầu, phí nhập tay ở trang chi tiết đơn.</summary>
    public bool RequestHomeDelivery { get; set; }

    /// <summary>Phí giao hàng tận nơi — nhập tay (không có bảng cấu hình).</summary>
    public decimal HomeDeliveryFeeAmount { get; set; }

    /// <summary>Tổng tiền đơn = ProductAmount + PurchaseFeeAmount + ShippingFeeCn + ShippingFeeVn + InsuranceFeeAmount + CheckProductFeeAmount + PackagingFeeAmount + HomeDeliveryFeeAmount.</summary>
    public decimal TotalAmount { get; set; }

    /// <summary>Phần trăm cọc tối thiểu áp dụng — lấy theo UserLevel.MinDepositPercent của khách (theo Tier), chỉ dùng để tính DepositAmount lúc tạo đơn.</summary>
    public decimal MinDepositPercentApplied { get; set; }

    /// <summary>
    /// Số tiền khách phải đặt cọc — tính sẵn = TotalAmount × MinDepositPercentApplied lúc tạo đơn, nhưng
    /// staff sửa tay được ở trang chi tiết sau đó (vd giảm cọc cho khách quen). Vì vậy KHÔNG tự tính lại
    /// trong RecalculateTotalsAsync khi sửa sản phẩm/phí nữa — sửa 1 lần rồi giữ nguyên, tránh đè mất giá
    /// trị staff đã chỉnh tay.
    /// </summary>
    public decimal DepositAmount { get; set; }

    /// <summary>Số tiền khách đã thanh toán/chuyển cọc — staff nhập tay (chưa có luồng ghi nhận thanh toán tự động).</summary>
    public decimal AmountPaid { get; set; }

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
