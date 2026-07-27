namespace OrderChina.Shared.Application.Fees.Dtos;

public record FeeBuyProListItem(
    Guid Id,
    decimal PriceFrom,
    decimal PriceTo,
    decimal Percent,
    bool IsActive,
    DateTime CreatedAtUtc,
    string? CreatedByUsername,
    DateTime? UpdatedAtUtc,
    string? UpdatedByUsername);

public record FeeBuyProListResult(IReadOnlyList<FeeBuyProListItem> Items, int TotalCount, int Page, int PageSize);

public record SaveFeeBuyProRequest(decimal PriceFrom, decimal PriceTo, decimal Percent, bool IsActive);

public record FeeBuyProResult(bool Succeeded, string? Error, FeeBuyProListItem? Item);
