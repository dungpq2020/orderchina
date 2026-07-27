using OrderChina.Shared.Application.Fees.Dtos;

namespace OrderChina.Shared.Application.Fees;

public interface IFeeBuyProService
{
    Task<FeeBuyProListResult> GetListAsync(int page, int pageSize, CancellationToken cancellationToken = default);

    Task<FeeBuyProResult> CreateAsync(SaveFeeBuyProRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<FeeBuyProResult> UpdateAsync(Guid id, SaveFeeBuyProRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, Guid actingUserId, CancellationToken cancellationToken = default);
}
