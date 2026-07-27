namespace OrderChina.Shared.Application.Fees.Dtos;

public record UserLevelListItem(
    Guid Id,
    string Name,
    int Rank,
    decimal PurchaseFeeDiscountPercent,
    decimal ShippingFeeDiscountPercent,
    decimal MinDepositPercent,
    bool IsActive,
    DateTime CreatedAtUtc,
    string? CreatedByUsername,
    DateTime? UpdatedAtUtc,
    string? UpdatedByUsername);

public record UpdateUserLevelRequest(decimal PurchaseFeeDiscountPercent, decimal ShippingFeeDiscountPercent, decimal MinDepositPercent);

public record CreateUserLevelRequest(
    string Name,
    int Rank,
    decimal PurchaseFeeDiscountPercent,
    decimal ShippingFeeDiscountPercent,
    decimal MinDepositPercent);

public record UserLevelResult(bool Succeeded, string? Error, UserLevelListItem? Item);
