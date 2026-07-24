using OrderChina.Shared.Application.Shipping.Dtos;

namespace OrderChina.Shared.Application.Shipping;

public interface IShippingMethodDirectoryService
{
    Task<IReadOnlyList<ShippingMethodDto>> GetShippingMethodsAsync(CancellationToken cancellationToken = default);
}
