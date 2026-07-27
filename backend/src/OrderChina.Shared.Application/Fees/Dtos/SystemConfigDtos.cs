namespace OrderChina.Shared.Application.Fees.Dtos;

public record SystemConfigDto(
    Guid Id,
    string WebsiteName,
    string? Address,
    string? PhoneNumber,
    string? ContactEmail,
    string? ChromeToolUrl,
    decimal PurchaseExchangeRate,
    decimal ConsignmentExchangeRate,
    decimal PaymentExchangeRate,
    decimal MinPurchaseFee,
    decimal PurchaseInsurancePercent,
    int MaxLinksPerOrder,
    int CartAutoDeleteDays,
    decimal SalesCommissionPurchasePercent,
    decimal PurchasingStaffCommissionPurchasePercent,
    decimal SalesCommissionConsignmentPercent,
    decimal SalesCommissionPaymentPercent,
    DateTime? UpdatedAtUtc,
    string? UpdatedByUsername);

public record UpdateSystemConfigRequest(
    string WebsiteName,
    string? Address,
    string? PhoneNumber,
    string? ContactEmail,
    string? ChromeToolUrl,
    decimal PurchaseExchangeRate,
    decimal ConsignmentExchangeRate,
    decimal PaymentExchangeRate,
    decimal MinPurchaseFee,
    decimal PurchaseInsurancePercent,
    int MaxLinksPerOrder,
    int CartAutoDeleteDays,
    decimal SalesCommissionPurchasePercent,
    decimal PurchasingStaffCommissionPurchasePercent,
    decimal SalesCommissionConsignmentPercent,
    decimal SalesCommissionPaymentPercent);

public record SystemConfigResult(bool Succeeded, string? Error, SystemConfigDto? Config);
