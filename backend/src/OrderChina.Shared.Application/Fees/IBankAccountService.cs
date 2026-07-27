using OrderChina.Shared.Application.Fees.Dtos;

namespace OrderChina.Shared.Application.Fees;

public interface IBankAccountService
{
    Task<IReadOnlyList<BankAccountListItem>> GetListAsync(CancellationToken cancellationToken = default);

    Task<BankAccountResult> CreateAsync(SaveBankAccountRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<BankAccountResult> UpdateAsync(Guid id, SaveBankAccountRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, Guid actingUserId, CancellationToken cancellationToken = default);
}
