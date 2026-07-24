using OrderChina.Shared.Application.Warehouses.Dtos;

namespace OrderChina.Shared.Application.Warehouses;

public interface IWarehouseDirectoryService
{
    Task<IReadOnlyList<WarehouseDto>> GetWarehousesAsync(string? type, CancellationToken cancellationToken = default);
}
