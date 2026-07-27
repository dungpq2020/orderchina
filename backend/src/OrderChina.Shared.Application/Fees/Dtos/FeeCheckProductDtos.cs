namespace OrderChina.Shared.Application.Fees.Dtos;

public record FeeCheckProductListItem(
    Guid Id,
    int PriceTier,
    int QuantityFrom,
    int QuantityTo,
    decimal Price,
    bool IsActive,
    DateTime CreatedAtUtc,
    string? CreatedByUsername,
    DateTime? UpdatedAtUtc,
    string? UpdatedByUsername);

public record FeeCheckProductListResult(IReadOnlyList<FeeCheckProductListItem> Items, int TotalCount, int Page, int PageSize);

public record SaveFeeCheckProductRequest(int PriceTier, int QuantityFrom, int QuantityTo, decimal Price, bool IsActive);

public record FeeCheckProductResult(bool Succeeded, string? Error, FeeCheckProductListItem? Item);
