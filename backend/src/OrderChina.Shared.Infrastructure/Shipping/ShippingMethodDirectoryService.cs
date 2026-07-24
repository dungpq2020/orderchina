using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Shipping;
using OrderChina.Shared.Application.Shipping.Dtos;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.Shared.Infrastructure.Shipping;

public class ShippingMethodDirectoryService : IShippingMethodDirectoryService
{
    private readonly AppDbContext _dbContext;

    public ShippingMethodDirectoryService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<ShippingMethodDto>> GetShippingMethodsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.ShippingMethods
            .AsNoTracking()
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .Select(s => new ShippingMethodDto(s.Id, s.Name))
            .ToListAsync(cancellationToken);
    }
}
