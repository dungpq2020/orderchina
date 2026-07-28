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
    IReadOnlyList<MainOrderTimelineEntry> Timeline);

public record MainOrderListResult(IReadOnlyList<MainOrderListItem> Items, int TotalCount, int Page, int PageSize);

public record MainOrderDepositResult(
    bool Succeeded,
    string? Error,
    decimal? NewWalletBalance,
    int? Status,
    decimal? AmountPaid,
    decimal? RemainingAmount);

public record MainOrderCancelResult(bool Succeeded, string? Error, int? Status);

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
    DateTime CreatedAtUtc);

public record GetMainOrderResult(bool Succeeded, string? Error, MainOrderDetail? Order);

public record UpdateMainOrderProductsRequest(IReadOnlyList<MainOrderProductInput> Products);

public record UpdateMainOrderExchangeRateRequest(decimal ExchangeRateApplied);

public record UpdateMainOrderResult(bool Succeeded, string? Error, MainOrderDetail? Order);

public record UpdateMainOrderStatusRequest(int Status);

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
    decimal AmountPaid);
