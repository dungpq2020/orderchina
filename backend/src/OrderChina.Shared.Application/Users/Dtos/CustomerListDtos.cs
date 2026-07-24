namespace OrderChina.Shared.Application.Users.Dtos;

public record CustomerListItem(
    Guid Id,
    string Username,
    string? Email,
    string? PhoneNumber,
    string FullName,
    string? Address,
    int Tier,
    decimal WalletBalance,
    decimal? CustomExchangeRate,
    decimal? CustomPurchaseFeePercent,
    decimal? CustomWeightFeePerKg,
    decimal? CustomVolumeFeePerCbm,
    Guid? SalesStaffId,
    string? SalesStaffName,
    Guid? OrderStaffId,
    string? OrderStaffName,
    Guid? ChinaWarehouseId,
    string? ChinaWarehouseName,
    Guid? VietnamWarehouseId,
    string? VietnamWarehouseName,
    Guid? ShippingMethodId,
    string? ShippingMethodName,
    string UserType,
    int Status,
    int Role,
    DateTime CreatedAtUtc);

public record CustomerListResult(IReadOnlyList<CustomerListItem> Items, int TotalCount, int Page, int PageSize);

public record UpdateCustomerRequest(
    string FullName,
    string? Email,
    string? PhoneNumber,
    string? Address,
    string? NewPassword,
    int Tier,
    decimal? CustomExchangeRate,
    decimal? CustomPurchaseFeePercent,
    decimal? CustomWeightFeePerKg,
    decimal? CustomVolumeFeePerCbm,
    Guid? SalesStaffId,
    Guid? OrderStaffId,
    Guid? ChinaWarehouseId,
    Guid? VietnamWarehouseId,
    Guid? ShippingMethodId,
    int Status,
    int Role);

public record UpdateCustomerResult(bool Succeeded, string? Error, CustomerListItem? Customer);

public record WalletAdjustRequest(decimal Amount, string Reason);

public record WalletAdjustResult(bool Succeeded, string? Error, decimal? NewBalance);
