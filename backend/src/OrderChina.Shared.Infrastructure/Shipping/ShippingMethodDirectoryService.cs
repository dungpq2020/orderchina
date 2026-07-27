using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Shipping;
using OrderChina.Shared.Application.Shipping.Dtos;
using OrderChina.Shared.Domain.Shipping;
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
            .Where(s => s.IsActive && !s.IsDeleted)
            .OrderBy(s => s.Name)
            .Select(s => new ShippingMethodDto(s.Id, s.Name))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ShippingMethodAdminListItem>> GetAdminListAsync(CancellationToken cancellationToken = default)
    {
        var rows = await _dbContext.ShippingMethods
            .AsNoTracking()
            .Where(s => !s.IsDeleted)
            .OrderByDescending(s => s.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return await MapToListItemsAsync(rows, cancellationToken);
    }

    public async Task<ShippingMethodAdminResult> CreateAsync(SaveShippingMethodRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return new ShippingMethodAdminResult(false, "Vui lòng nhập tên phương thức.", null);
        }

        var entity = new ShippingMethod
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            IsActive = request.IsActive,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedByUserId = actingUserId,
        };

        _dbContext.ShippingMethods.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var item = (await MapToListItemsAsync([entity], cancellationToken))[0];
        return new ShippingMethodAdminResult(true, null, item);
    }

    public async Task<ShippingMethodAdminResult> UpdateAsync(Guid id, SaveShippingMethodRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return new ShippingMethodAdminResult(false, "Vui lòng nhập tên phương thức.", null);
        }

        var entity = await _dbContext.ShippingMethods.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
        if (entity is null)
        {
            return new ShippingMethodAdminResult(false, "Không tìm thấy phương thức.", null);
        }

        entity.Name = request.Name;
        entity.IsActive = request.IsActive;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedByUserId = actingUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var item = (await MapToListItemsAsync([entity], cancellationToken))[0];
        return new ShippingMethodAdminResult(true, null, item);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.ShippingMethods.FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
        if (entity is null)
        {
            return false;
        }

        entity.IsDeleted = true;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedByUserId = actingUserId;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task<IReadOnlyList<ShippingMethodAdminListItem>> MapToListItemsAsync(IReadOnlyList<ShippingMethod> rows, CancellationToken cancellationToken)
    {
        var referencedIds = rows
            .SelectMany(s => new[] { s.CreatedByUserId, s.UpdatedByUserId })
            .Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();

        var usernames = await _dbContext.Users
            .AsNoTracking()
            .Where(u => referencedIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName!, cancellationToken);

        return rows.Select(s => new ShippingMethodAdminListItem(
            s.Id,
            s.Name,
            s.IsActive,
            s.CreatedAtUtc,
            s.CreatedByUserId is { } createdById ? usernames.GetValueOrDefault(createdById) : null,
            s.UpdatedAtUtc,
            s.UpdatedByUserId is { } updatedById ? usernames.GetValueOrDefault(updatedById) : null))
            .ToList();
    }
}
