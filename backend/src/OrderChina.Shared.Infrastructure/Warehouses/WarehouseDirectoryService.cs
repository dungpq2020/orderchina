using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Warehouses;
using OrderChina.Shared.Application.Warehouses.Dtos;
using OrderChina.Shared.Domain.Warehouses;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.Shared.Infrastructure.Warehouses;

public class WarehouseDirectoryService : IWarehouseDirectoryService
{
    private readonly AppDbContext _dbContext;

    public WarehouseDirectoryService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<WarehouseDto>> GetWarehousesAsync(string? type, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Warehouses.AsNoTracking().Where(w => w.IsActive);

        if (!string.IsNullOrWhiteSpace(type) && Enum.TryParse<WarehouseType>(type, true, out var parsedType))
        {
            query = query.Where(w => w.Type == parsedType);
        }

        return await query
            .OrderBy(w => w.Name)
            .Select(w => new WarehouseDto(w.Id, w.Name, w.Type.ToString()))
            .ToListAsync(cancellationToken);
    }
}
