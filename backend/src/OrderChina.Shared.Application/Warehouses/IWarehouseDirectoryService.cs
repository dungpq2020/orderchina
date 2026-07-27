using OrderChina.Shared.Application.Warehouses.Dtos;

namespace OrderChina.Shared.Application.Warehouses;

public interface IWarehouseDirectoryService
{
    Task<IReadOnlyList<WarehouseDto>> GetWarehousesAsync(string? type, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WarehouseAdminListItem>> GetAdminListAsync(string? type, CancellationToken cancellationToken = default);

    Task<WarehouseAdminResult> CreateAsync(SaveWarehouseRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<WarehouseAdminResult> UpdateAsync(Guid id, SaveWarehouseRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, Guid actingUserId, CancellationToken cancellationToken = default);
}
