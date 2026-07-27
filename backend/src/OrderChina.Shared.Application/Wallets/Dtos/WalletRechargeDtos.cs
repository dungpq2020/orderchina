namespace OrderChina.Shared.Application.Wallets.Dtos;

public record CreateWalletRechargeRequest(Guid UserId, Guid? BankAccountId, decimal Amount, string? Note, int Status);

public record WalletRechargeListItem(
    Guid Id,
    Guid UserId,
    Guid? BankAccountId,
    string? BankName,
    decimal Amount,
    string? Note,
    int Status,
    DateTime CreatedAtUtc,
    string? CreatedByUsername);

public record WalletRechargeResult(bool Succeeded, string? Error, decimal? NewWalletBalance);

public record WalletRechargeRequestListItem(
    Guid Id,
    Guid UserId,
    string Username,
    Guid? BankAccountId,
    string? BankName,
    decimal Amount,
    string? Note,
    int Status,
    DateTime CreatedAtUtc,
    string? CreatedByUsername,
    DateTime? ApprovedAtUtc,
    string? ApprovedByUsername);

public record WalletRechargeRequestListResult(IReadOnlyList<WalletRechargeRequestListItem> Items, int TotalCount, int Page, int PageSize);
