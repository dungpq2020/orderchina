namespace OrderChina.Shared.Application.Fees.Dtos;

public record BankAccountListItem(
    Guid Id,
    string BankName,
    string AccountNumber,
    string AccountHolderName,
    string? Branch,
    string? QrCodeUrl,
    bool IsActive,
    DateTime CreatedAtUtc,
    string? CreatedByUsername,
    DateTime? UpdatedAtUtc,
    string? UpdatedByUsername);

public record SaveBankAccountRequest(
    string BankName,
    string AccountNumber,
    string AccountHolderName,
    string? Branch,
    string? QrCodeUrl,
    bool IsActive);

public record BankAccountResult(bool Succeeded, string? Error, BankAccountListItem? Item);
