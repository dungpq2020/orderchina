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

public record UpdateMainOrderStaffRequest(Guid? OrderStaffId, Guid? SalesStaffId);

public record UpdateMainOrderStaffResult(bool Succeeded, string? Error);
