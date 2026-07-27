namespace OrderChina.Shared.Application.Wallets.Dtos;

public record WalletTransactionListItem(
    Guid Id,
    decimal Amount,
    decimal BalanceAfter,
    int Type,
    string? Description,
    DateTime CreatedAtUtc,
    string? CreatedByUsername);

public record WalletTransactionHistoryResult(
    string Username,
    decimal WalletBalance,
    IReadOnlyList<WalletTransactionListItem> Items,
    int TotalCount,
    int Page,
    int PageSize);
