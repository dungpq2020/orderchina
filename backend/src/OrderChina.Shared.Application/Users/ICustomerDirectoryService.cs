using OrderChina.Shared.Application.Users.Dtos;

namespace OrderChina.Shared.Application.Users;

public interface ICustomerDirectoryService
{
    Task<CustomerListResult> GetCustomersAsync(int page, int pageSize, CustomerListFilter filter, CancellationToken cancellationToken = default);

    Task<UpdateCustomerResult> UpdateCustomerAsync(Guid id, UpdateCustomerRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<WalletAdjustResult> AdjustWalletAsync(Guid id, WalletAdjustRequest request, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CustomerSearchItem>> SearchCustomersAsync(string query, CancellationToken cancellationToken = default);
}
