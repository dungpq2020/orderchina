namespace OrderChina.Shared.Application.Orders.Dtos;

public record MainOrderProductInput(
    string? ImageUrl,
    string? ProductLink,
    string ProductName,
    string? Attributes,
    decimal UnitPriceCny,
    int Quantity,
    string? Note);

public record MainOrderServiceOptions(bool RequestPackaging, bool RequestInsurance, bool RequestCheckProduct, bool RequestHomeDelivery);

public record PreviewMainOrderRequest(Guid CustomerId, IReadOnlyList<MainOrderProductInput> Products, MainOrderServiceOptions Services);

public record PreviewMainOrderResult(
    bool Succeeded,
    string? Error,
    decimal ExchangeRateApplied,
    decimal ProductAmount,
    decimal PurchaseFeePercentApplied,
    decimal PurchaseFeeAmount,
    decimal ShippingFeeCn,
    decimal ShippingFeeVn,
    decimal InsuranceFeeAmount,
    decimal CheckProductFeeAmount,
    decimal TotalAmount,
    decimal MinDepositPercentApplied,
    decimal DepositAmount);

public record CreateMainOrderRequest(
    Guid CustomerId,
    IReadOnlyList<MainOrderProductInput> Products,
    Guid ChinaWarehouseId,
    Guid VietnamWarehouseId,
    Guid ShippingMethodId,
    MainOrderServiceOptions Services,
    string? Note);

public record CreateMainOrderResult(bool Succeeded, string? Error, Guid? OrderId, string? OrderCode);

public record MainOrderTimelineEntry(int Status, DateTime AtUtc);

public record MainOrderListItem(
    Guid Id,
    long OrderNumber,
    string OrderCode,
    Guid UserId,
    string Username,
    int OrderType,
    int CreationType,
    string? FirstProductImageUrl,
    string? FirstProductLink,
    decimal ProductAmountCny,
    decimal ExchangeRateApplied,
    decimal ProductAmount,
    decimal PurchaseFeeAmount,
    decimal ShippingFeeCn,
    decimal ShippingFeeVn,
    decimal InsuranceFeeAmount,
    decimal CheckProductFeeAmount,
    decimal TotalAmount,
    decimal DepositAmount,
    decimal AmountPaid,
    decimal RemainingAmount,
    string? VietnamWarehouseName,
    Guid? OrderStaffId,
    string? OrderStaffUsername,
    Guid? SalesStaffId,
    string? SalesStaffUsername,
    int Status,
    int ProductCount,
    DateTime CreatedAtUtc,
    string? CreatedByUsername,
    IReadOnlyList<MainOrderTimelineEntry> Timeline,
    IReadOnlyList<string> ShopCodes,
    IReadOnlyList<string> TrackingCodes);

public record MainOrderListResult(IReadOnlyList<MainOrderListItem> Items, int TotalCount, int Page, int PageSize);

public record MainOrderDepositResult(
    bool Succeeded,
    string? Error,
    decimal? NewWalletBalance,
    int? Status,
    decimal? AmountPaid,
    decimal? RemainingAmount);

public record MainOrderCancelResult(bool Succeeded, string? Error, int? Status);

public record MainOrderPayResult(
    bool Succeeded,
    string? Error,
    decimal? NewWalletBalance,
    int? Status,
    decimal? AmountPaid,
    decimal? RemainingAmount);

public record UpdateMainOrderStaffRequest(Guid? OrderStaffId, Guid? SalesStaffId);

public record UpdateMainOrderStaffResult(bool Succeeded, string? Error);

public record MainOrderProductDetail(
    Guid Id,
    string? ImageUrl,
    string? ProductLink,
    string ProductName,
    string? Attributes,
    decimal UnitPriceCny,
    int Quantity,
    string? Note);

public record MainOrderShopCodeItem(Guid Id, string Code, DateTime CreatedAtUtc, string? CreatedByUsername);

/// <summary><paramref name="Id"/>: null = dòng mới thêm; có giá trị = dòng đã tồn tại, giữ nguyên CreatedAtUtc/CreatedByUsername cũ.</summary>
public record MainOrderShopCodeInput(Guid? Id, string Code);

public record UpdateMainOrderShopCodesRequest(IReadOnlyList<MainOrderShopCodeInput> ShopCodes, string? RowVersion = null);

public record MainOrderTrackingCodeItem(
    Guid Id,
    string Code,
    decimal WeightKg,
    decimal LengthCm,
    decimal WidthCm,
    decimal HeightCm,
    /// <summary>Dài×Rộng×Cao / SystemConfig.VolumetricWeightDivisor — cân quy đổi, KHÔNG phải thể tích (m3).</summary>
    decimal VolumetricWeightKg,
    int Status,
    string? Note,
    DateTime CreatedAtUtc,
    string? CreatedByUsername,
    DateTime? ArrivedChinaWarehouseAtUtc,
    string? ArrivedChinaWarehouseByUsername,
    DateTime? InTransitToVietnamAtUtc,
    string? InTransitToVietnamByUsername,
    DateTime? ArrivedVietnamWarehouseAtUtc,
    string? ArrivedVietnamWarehouseByUsername,
    DateTime? DeliveredToCustomerAtUtc,
    string? DeliveredToCustomerByUsername);

/// <summary><paramref name="Id"/>: null = dòng mới thêm; có giá trị = dòng đã tồn tại, giữ nguyên CreatedAtUtc/các mốc ngày trạng thái cũ khi cập nhật.</summary>
public record MainOrderTrackingCodeInput(
    Guid? Id,
    string Code,
    decimal WeightKg,
    decimal LengthCm,
    decimal WidthCm,
    decimal HeightCm,
    int Status,
    string? Note);

public record UpdateMainOrderTrackingCodesRequest(IReadOnlyList<MainOrderTrackingCodeInput> TrackingCodes, string? RowVersion = null);

/// <summary>
/// Trang "Kiểm hàng kho Trung Quốc" — nhân viên kho quét/nhập mã vận đơn (không biết trước đơn nào), nhập
/// cân nặng + kích thước rồi lưu. Server tự tra ra MainOrder tương ứng qua Code, cập nhật cả kiện hàng lẫn
/// đơn hàng (cân nặng tổng, phí vận chuyển, trạng thái) trong 1 request.
/// </summary>
/// <summary><paramref name="Id"/>: kiện cụ thể lấy từ bước tra cứu (bắt buộc dùng khi Code bị trùng trên nhiều đơn) — null thì tự tra theo Code (lấy kiện tạo gần nhất).</summary>
public record CheckInTrackingCodeChinaWarehouseRequest(
    Guid? Id,
    string Code,
    decimal WeightKg,
    decimal LengthCm,
    decimal WidthCm,
    decimal HeightCm,
    string? Note);

/// <summary>
/// Trang "Xuất kho Trung Quốc" — quét mã vận đơn đã kiểm hàng (ArrivedChinaWarehouse) để đánh dấu rời kho
/// TQ, chuyển sang InTransitToVietnam — vẫn cho sửa lại cân/kích thước (cân lại lần cuối trước khi xuất
/// kho nếu cần), giống hệt CheckInTrackingCodeChinaWarehouseRequest. <paramref name="Id"/>: xem giải thích ở CheckInTrackingCodeChinaWarehouseRequest.
/// </summary>
public record ExportTrackingCodeChinaWarehouseRequest(
    Guid? Id,
    string Code,
    decimal WeightKg,
    decimal LengthCm,
    decimal WidthCm,
    decimal HeightCm,
    string? Note);

/// <summary>
/// Trang "Kiểm kho Việt Nam" — quét mã vận đơn đã xuất kho TQ (InTransitToVietnam) để xác nhận về tới kho
/// VN, chuyển sang ArrivedVietnamWarehouse — vẫn cho sửa lại cân/kích thước (cân lại khi về VN nếu lệch so
/// với lúc xuất TQ), giống hệt CheckInTrackingCodeChinaWarehouseRequest. <paramref name="Id"/>: xem giải thích ở CheckInTrackingCodeChinaWarehouseRequest.
/// </summary>
public record CheckInTrackingCodeVietnamWarehouseRequest(
    Guid? Id,
    string Code,
    decimal WeightKg,
    decimal LengthCm,
    decimal WidthCm,
    decimal HeightCm,
    string? Note);

/// <summary>
/// Trang "Kiểm hàng kho Trung Quốc" — tra cứu thuần (không sửa dữ liệu) ngay sau khi quét mã, để hiển thị
/// ngữ cảnh đơn hàng (khách, dịch vụ, số sản phẩm) trước khi staff nhập cân/kích thước và bấm Cập nhật.
/// </summary>
public record TrackingCodeLookupDto(
    Guid Id,
    string Code,
    int Status,
    decimal WeightKg,
    decimal LengthCm,
    decimal WidthCm,
    decimal HeightCm,
    string? Note,
    Guid OrderId,
    string OrderCode,
    int OrderType,
    string Username,
    string? PhoneNumber,
    bool RequestCheckProduct,
    bool RequestPackaging,
    bool RequestInsurance,
    bool RequestHomeDelivery,
    int ProductTypeCount,
    int ProductQuantityTotal);

/// <summary>
/// Code chưa có unique index ở DB — 1 mã có thể trùng trên nhiều đơn (nhập tay sai), nên trả về TẤT CẢ các
/// kiện khớp mã, không chỉ 1 dòng, để staff tự chọn đúng đơn cần kiểm/xuất.
/// </summary>
public record TrackingCodeLookupResult(bool Succeeded, string? Error, IReadOnlyList<TrackingCodeLookupDto> Items);

/// <summary>Trang "Quản lý kiện hàng" — danh sách mã vận đơn của mọi đơn, lọc theo trạng thái + tìm theo mã vận đơn/mã đơn/username.</summary>
public record TrackingCodeListItem(
    Guid Id,
    string Code,
    Guid OrderId,
    long OrderNumber,
    string OrderCode,
    int OrderType,
    string Username,
    decimal WeightKg,
    decimal LengthCm,
    decimal WidthCm,
    decimal HeightCm,
    decimal VolumetricWeightKg,
    int Status,
    string? Note,
    DateTime CreatedAtUtc,
    string? CreatedByUsername,
    DateTime? ArrivedChinaWarehouseAtUtc,
    string? ArrivedChinaWarehouseByUsername,
    DateTime? InTransitToVietnamAtUtc,
    string? InTransitToVietnamByUsername,
    DateTime? ArrivedVietnamWarehouseAtUtc,
    string? ArrivedVietnamWarehouseByUsername,
    DateTime? DeliveredToCustomerAtUtc,
    string? DeliveredToCustomerByUsername);

public record TrackingCodeListResult(IReadOnlyList<TrackingCodeListItem> Items, int TotalCount, int Page, int PageSize);

public record MainOrderPaymentHistoryItem(
    Guid Id,
    int Type,
    int Method,
    decimal Amount,
    Guid PerformedByUserId,
    string? PerformedByUsername,
    int PerformedByRole,
    DateTime PaidAtUtc);

/// <summary>Trang chi tiết đơn — mục "Lịch sử thao tác", ghi lại mọi hành động làm thay đổi dữ liệu đơn.</summary>
public record MainOrderActivityLogItem(
    Guid Id,
    string Description,
    Guid PerformedByUserId,
    string? PerformedByUsername,
    int PerformedByRole,
    DateTime PerformedAtUtc);

public record MainOrderDetail(
    Guid Id,
    long OrderNumber,
    string OrderCode,
    Guid UserId,
    string Username,
    int OrderType,
    int CreationType,
    int Status,
    Guid? ChinaWarehouseId,
    string? ChinaWarehouseName,
    Guid? VietnamWarehouseId,
    string? VietnamWarehouseName,
    Guid? ShippingMethodId,
    string? ShippingMethodName,
    Guid? OrderStaffId,
    string? OrderStaffUsername,
    Guid? SalesStaffId,
    string? SalesStaffUsername,
    IReadOnlyList<MainOrderProductDetail> Products,
    decimal ExchangeRateApplied,
    decimal ProductAmountCny,
    decimal ProductAmount,
    decimal PurchaseFeePercentApplied,
    decimal PurchaseFeeAmount,
    decimal ShippingFeeCnCny,
    decimal ShippingFeeCn,
    decimal TotalWeightKg,
    decimal UnitWeightPriceVnd,
    decimal ShippingFeeVn,
    bool RequestCheckProduct,
    decimal CheckProductFeeAmount,
    bool RequestPackaging,
    decimal PackagingFeeAmount,
    bool RequestInsurance,
    decimal InsuranceFeeAmount,
    bool RequestHomeDelivery,
    decimal HomeDeliveryFeeAmount,
    decimal ActualPurchaseAmountCny,
    decimal ActualPurchaseAmountVnd,
    decimal CommissionAmount,
    decimal TotalAmount,
    decimal MinDepositPercentApplied,
    decimal DepositAmount,
    decimal AmountPaid,
    decimal RemainingAmount,
    string? Note,
    DateTime CreatedAtUtc,
    IReadOnlyList<MainOrderPaymentHistoryItem> PaymentHistories,
    IReadOnlyList<MainOrderShopCodeItem> ShopCodes,
    IReadOnlyList<MainOrderTrackingCodeItem> TrackingCodes,
    IReadOnlyList<MainOrderActivityLogItem> ActivityLogs,
    /// <summary>Token concurrency (giá trị "xmin" của Postgres) — client gửi lại nguyên giá trị này ở các
    /// request cập nhật để backend phát hiện đơn đã bị người khác sửa từ lúc tải trang, tránh ghi đè mất dữ liệu.</summary>
    string RowVersion);

public record GetMainOrderResult(bool Succeeded, string? Error, MainOrderDetail? Order);

public record UpdateMainOrderProductsRequest(IReadOnlyList<MainOrderProductInput> Products, string? RowVersion = null);

public record UpdateMainOrderExchangeRateRequest(decimal ExchangeRateApplied, string? RowVersion = null);

/// <summary><paramref name="IsConflict"/>: true khi thất bại do concurrency (đơn đã bị sửa từ nơi khác) — controller trả 409 thay vì 400 để frontend phân biệt được với lỗi validate thường.</summary>
public record UpdateMainOrderResult(bool Succeeded, string? Error, MainOrderDetail? Order, bool IsConflict = false);

public record UpdateMainOrderStatusRequest(int Status, string? RowVersion = null);

/// <summary>
/// Toàn bộ sidebar + khối Phí cố định/Phí tùy chọn trang chi tiết — 1 nút "Cập nhật" duy nhất lưu hết
/// trong 1 lần gọi API (không tách /info và /fees riêng để tránh 2 request cho 1 hành động của người dùng).
/// </summary>
public record UpdateMainOrderInfoRequest(
    int Status,
    Guid ChinaWarehouseId,
    Guid VietnamWarehouseId,
    Guid ShippingMethodId,
    decimal ShippingFeeCnCny,
    decimal ShippingFeeVn,
    decimal ActualPurchaseAmountCny,
    bool RequestCheckProduct,
    bool RequestPackaging,
    decimal PackagingFeeAmount,
    bool RequestInsurance,
    bool RequestHomeDelivery,
    decimal HomeDeliveryFeeAmount,
    decimal DepositAmount,
    decimal AmountPaid,
    string? RowVersion = null);
