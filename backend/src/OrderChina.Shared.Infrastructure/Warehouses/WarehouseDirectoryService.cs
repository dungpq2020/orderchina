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
        var query = _dbContext.Warehouses.AsNoTracking().Where(w => w.IsActive && !w.IsDeleted);

        if (!string.IsNullOrWhiteSpace(type) && Enum.TryParse<WarehouseType>(type, true, out var parsedType))
        {
            query = query.Where(w => w.Type == parsedType);
        }

        return await query
            .OrderBy(w => w.Name)
            .Select(w => new WarehouseDto(w.Id, w.Name, w.Type.ToString()))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<WarehouseAdminListItem>> GetAdminListAsync(string? type, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Warehouses.AsNoTracking().Where(w => !w.IsDeleted);

        if (!string.IsNullOrWhiteSpace(type) && Enum.TryParse<WarehouseType>(type, true, out var parsedType))
        {
            query = query.Where(w => w.Type == parsedType);
        }

        var rows = await query.OrderByDescending(w => w.CreatedAtUtc).ToListAsync(cancellationToken);
        return await MapToListItemsAsync(rows, cancellationToken);
    }

    public async Task<WarehouseAdminResult> CreateAsync(SaveWarehouseRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var validationError = Validate(request, out var type);
        if (validationError is not null)
        {
            return new WarehouseAdminResult(false, validationError, null);
        }

        var entity = new Warehouse
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Address = request.Address,
            Type = type,
            IsActive = request.IsActive,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedByUserId = actingUserId,
        };

        _dbContext.Warehouses.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var item = (await MapToListItemsAsync([entity], cancellationToken))[0];
        return new WarehouseAdminResult(true, null, item);
    }

    public async Task<WarehouseAdminResult> UpdateAsync(Guid id, SaveWarehouseRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var validationError = Validate(request, out var type);
        if (validationError is not null)
        {
            return new WarehouseAdminResult(false, validationError, null);
        }

        var entity = await _dbContext.Warehouses.FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
        if (entity is null)
        {
            return new WarehouseAdminResult(false, "Không tìm thấy kho.", null);
        }

        entity.Name = request.Name;
        entity.Address = request.Address;
        entity.Type = type;
        entity.IsActive = request.IsActive;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedByUserId = actingUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var item = (await MapToListItemsAsync([entity], cancellationToken))[0];
        return new WarehouseAdminResult(true, null, item);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Warehouses.FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
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

    private static string? Validate(SaveWarehouseRequest request, out WarehouseType type)
    {
        type = default;

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return "Vui lòng nhập tên kho.";
        }

        if (!Enum.TryParse(request.Type, true, out type))
        {
            return "Loại kho không hợp lệ.";
        }

        return null;
    }

    private async Task<IReadOnlyList<WarehouseAdminListItem>> MapToListItemsAsync(IReadOnlyList<Warehouse> rows, CancellationToken cancellationToken)
    {
        var referencedIds = rows
            .SelectMany(w => new[] { w.CreatedByUserId, w.UpdatedByUserId })
            .Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();

        var usernames = await _dbContext.Users
            .AsNoTracking()
            .Where(u => referencedIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName!, cancellationToken);

        return rows.Select(w => new WarehouseAdminListItem(
            w.Id,
            w.Name,
            w.Address,
            w.Type.ToString(),
            w.IsActive,
            w.CreatedAtUtc,
            w.CreatedByUserId is { } createdById ? usernames.GetValueOrDefault(createdById) : null,
            w.UpdatedAtUtc,
            w.UpdatedByUserId is { } updatedById ? usernames.GetValueOrDefault(updatedById) : null))
            .ToList();
    }
}
