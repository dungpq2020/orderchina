using OrderChina.Shared.Application.Fees.Dtos;

namespace OrderChina.Shared.Application.Fees;

public interface IFeeCheckProductService
{
    Task<FeeCheckProductListResult> GetListAsync(int priceTier, int page, int pageSize, CancellationToken cancellationToken = default);

    Task<FeeCheckProductResult> CreateAsync(SaveFeeCheckProductRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<FeeCheckProductResult> UpdateAsync(Guid id, SaveFeeCheckProductRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, Guid actingUserId, CancellationToken cancellationToken = default);
}
