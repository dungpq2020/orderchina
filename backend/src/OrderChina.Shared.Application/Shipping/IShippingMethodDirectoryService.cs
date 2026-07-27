using OrderChina.Shared.Application.Shipping.Dtos;

namespace OrderChina.Shared.Application.Shipping;

public interface IShippingMethodDirectoryService
{
    Task<IReadOnlyList<ShippingMethodDto>> GetShippingMethodsAsync(CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ShippingMethodAdminListItem>> GetAdminListAsync(CancellationToken cancellationToken = default);

    Task<ShippingMethodAdminResult> CreateAsync(SaveShippingMethodRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<ShippingMethodAdminResult> UpdateAsync(Guid id, SaveShippingMethodRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, Guid actingUserId, CancellationToken cancellationToken = default);
}
