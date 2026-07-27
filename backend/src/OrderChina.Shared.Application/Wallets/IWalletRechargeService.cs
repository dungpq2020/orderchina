using OrderChina.Shared.Application.Wallets.Dtos;

namespace OrderChina.Shared.Application.Wallets;

public interface IWalletRechargeService
{
    Task<WalletRechargeResult> CreateAsync(CreateWalletRechargeRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WalletRechargeListItem>> GetHistoryAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<WalletTransactionHistoryResult?> GetTransactionHistoryAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken = default);

    Task<WalletRechargeRequestListResult> GetRequestListAsync(int page, int pageSize, CancellationToken cancellationToken = default);

    Task<WalletRechargeResult> ApproveAsync(Guid id, Guid actingUserId, CancellationToken cancellationToken = default);
}
