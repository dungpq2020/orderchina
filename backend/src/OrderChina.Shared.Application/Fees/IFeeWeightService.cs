using OrderChina.Shared.Application.Fees.Dtos;

namespace OrderChina.Shared.Application.Fees;

public interface IFeeWeightService
{
    Task<FeeWeightListResult> GetListAsync(int page, int pageSize, CancellationToken cancellationToken = default);

    Task<FeeWeightResult> CreateAsync(SaveFeeWeightRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<FeeWeightResult> UpdateAsync(Guid id, SaveFeeWeightRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, Guid actingUserId, CancellationToken cancellationToken = default);
}
