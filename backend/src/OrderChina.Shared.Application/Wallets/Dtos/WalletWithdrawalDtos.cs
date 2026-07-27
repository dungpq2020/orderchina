namespace OrderChina.Shared.Application.Wallets.Dtos;

public record CreateWalletWithdrawalRequest(
    Guid UserId,
    decimal Amount,
    string? BankName,
    string? BankAccountNumber,
    string? BankAccountHolderName,
    string? Note,
    int Status);

public record WalletWithdrawalListItem(
    Guid Id,
    Guid UserId,
    decimal Amount,
    string? BankName,
    string? BankAccountNumber,
    string? BankAccountHolderName,
    string? Note,
    int Status,
    DateTime CreatedAtUtc,
    string? CreatedByUsername);

public record WalletWithdrawalResult(bool Succeeded, string? Error, decimal? NewWalletBalance);

public record WalletWithdrawalRequestListItem(
    Guid Id,
    Guid UserId,
    string Username,
    decimal Amount,
    string? BankName,
    string? BankAccountNumber,
    string? BankAccountHolderName,
    string? Note,
    int Status,
    DateTime CreatedAtUtc,
    string? CreatedByUsername,
    DateTime? ApprovedAtUtc,
    string? ApprovedByUsername);

public record WalletWithdrawalRequestListResult(IReadOnlyList<WalletWithdrawalRequestListItem> Items, int TotalCount, int Page, int PageSize);
