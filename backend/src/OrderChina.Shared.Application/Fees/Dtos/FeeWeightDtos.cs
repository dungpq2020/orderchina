namespace OrderChina.Shared.Application.Fees.Dtos;

public record FeeWeightListItem(
    Guid Id,
    int OrderType,
    Guid FromWarehouseId,
    string FromWarehouseName,
    Guid ToWarehouseId,
    string ToWarehouseName,
    decimal WeightFrom,
    decimal WeightTo,
    decimal Price,
    Guid ShippingMethodId,
    string ShippingMethodName,
    bool IsActive,
    DateTime CreatedAtUtc,
    string? CreatedByUsername,
    DateTime? UpdatedAtUtc,
    string? UpdatedByUsername);

public record FeeWeightListResult(IReadOnlyList<FeeWeightListItem> Items, int TotalCount, int Page, int PageSize);

public record SaveFeeWeightRequest(
    int OrderType,
    Guid FromWarehouseId,
    Guid ToWarehouseId,
    decimal WeightFrom,
    decimal WeightTo,
    decimal Price,
    Guid ShippingMethodId,
    bool IsActive);

public record FeeWeightResult(bool Succeeded, string? Error, FeeWeightListItem? Item);
