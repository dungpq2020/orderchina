using OrderChina.Shared.Application.Wallets.Dtos;

namespace OrderChina.Shared.Application.Wallets;

public interface IWalletWithdrawalService
{
    Task<WalletWithdrawalResult> CreateAsync(CreateWalletWithdrawalRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WalletWithdrawalListItem>> GetHistoryAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<WalletWithdrawalRequestListResult> GetRequestListAsync(int page, int pageSize, CancellationToken cancellationToken = default);

    Task<WalletWithdrawalResult> ApproveAsync(Guid id, Guid actingUserId, CancellationToken cancellationToken = default);
}
