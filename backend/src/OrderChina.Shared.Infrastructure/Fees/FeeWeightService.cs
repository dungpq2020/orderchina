using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Fees;
using OrderChina.Shared.Application.Fees.Dtos;
using OrderChina.Shared.Domain.Fees;
using OrderChina.Shared.Domain.Warehouses;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.Shared.Infrastructure.Fees;

public class FeeWeightService : IFeeWeightService
{
    private readonly AppDbContext _dbContext;

    public FeeWeightService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<FeeWeightListResult> GetListAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 20 : pageSize;

        var query = _dbContext.FeeWeights.AsNoTracking().Where(f => !f.IsDeleted);

        var totalCount = await query.CountAsync(cancellationToken);

        var rows = await query
            .OrderByDescending(f => f.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = await MapToListItemsAsync(rows, cancellationToken);

        return new FeeWeightListResult(items, totalCount, page, pageSize);
    }

    public async Task<FeeWeightResult> CreateAsync(SaveFeeWeightRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var validationError = await ValidateAsync(request, cancellationToken);
        if (validationError is not null)
        {
            return new FeeWeightResult(false, validationError, null);
        }

        var entity = new FeeWeight
        {
            Id = Guid.NewGuid(),
            OrderType = (FeeOrderType)request.OrderType,
            FromWarehouseId = request.FromWarehouseId,
            ToWarehouseId = request.ToWarehouseId,
            WeightFrom = request.WeightFrom,
            WeightTo = request.WeightTo,
            Price = request.Price,
            ShippingMethodId = request.ShippingMethodId,
            IsActive = request.IsActive,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedByUserId = actingUserId,
        };

        _dbContext.FeeWeights.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var item = (await MapToListItemsAsync([entity], cancellationToken))[0];
        return new FeeWeightResult(true, null, item);
    }

    public async Task<FeeWeightResult> UpdateAsync(Guid id, SaveFeeWeightRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var validationError = await ValidateAsync(request, cancellationToken);
        if (validationError is not null)
        {
            return new FeeWeightResult(false, validationError, null);
        }

        var entity = await _dbContext.FeeWeights.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (entity is null)
        {
            return new FeeWeightResult(false, "Không tìm thấy bậc phí.", null);
        }

        entity.OrderType = (FeeOrderType)request.OrderType;
        entity.FromWarehouseId = request.FromWarehouseId;
        entity.ToWarehouseId = request.ToWarehouseId;
        entity.WeightFrom = request.WeightFrom;
        entity.WeightTo = request.WeightTo;
        entity.Price = request.Price;
        entity.ShippingMethodId = request.ShippingMethodId;
        entity.IsActive = request.IsActive;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedByUserId = actingUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var item = (await MapToListItemsAsync([entity], cancellationToken))[0];
        return new FeeWeightResult(true, null, item);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.FeeWeights.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
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

    private async Task<string?> ValidateAsync(SaveFeeWeightRequest request, CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(typeof(FeeOrderType), request.OrderType))
        {
            return "Loại đơn hàng không hợp lệ.";
        }

        if (request.WeightFrom < 0 || request.WeightTo < 0 || request.Price < 0)
        {
            return "Giá trị không được âm.";
        }

        if (request.WeightTo <= request.WeightFrom)
        {
            return "Cân nặng đến phải lớn hơn cân nặng từ.";
        }

        var fromWarehouse = await _dbContext.Warehouses.FirstOrDefaultAsync(w => w.Id == request.FromWarehouseId && !w.IsDeleted, cancellationToken);
        if (fromWarehouse is null || fromWarehouse.Type != WarehouseType.China)
        {
            return "Kho đi không hợp lệ (phải là kho Trung Quốc).";
        }

        var toWarehouse = await _dbContext.Warehouses.FirstOrDefaultAsync(w => w.Id == request.ToWarehouseId && !w.IsDeleted, cancellationToken);
        if (toWarehouse is null || toWarehouse.Type != WarehouseType.Vietnam)
        {
            return "Kho đến không hợp lệ (phải là kho Việt Nam).";
        }

        var shippingMethodExists = await _dbContext.ShippingMethods.AnyAsync(s => s.Id == request.ShippingMethodId && !s.IsDeleted, cancellationToken);
        if (!shippingMethodExists)
        {
            return "Hình thức vận chuyển không hợp lệ.";
        }

        return null;
    }

    private async Task<IReadOnlyList<FeeWeightListItem>> MapToListItemsAsync(IReadOnlyList<FeeWeight> rows, CancellationToken cancellationToken)
    {
        var warehouseIds = rows.SelectMany(f => new[] { f.FromWarehouseId, f.ToWarehouseId }).Distinct().ToList();
        var warehouseNames = await _dbContext.Warehouses
            .AsNoTracking()
            .Where(w => warehouseIds.Contains(w.Id))
            .ToDictionaryAsync(w => w.Id, w => w.Name, cancellationToken);

        var shippingMethodIds = rows.Select(f => f.ShippingMethodId).Distinct().ToList();
        var shippingMethodNames = await _dbContext.ShippingMethods
            .AsNoTracking()
            .Where(s => shippingMethodIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, s => s.Name, cancellationToken);

        var referencedUserIds = rows
            .SelectMany(f => new[] { f.CreatedByUserId, f.UpdatedByUserId })
            .Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();

        var usernames = await _dbContext.Users
            .AsNoTracking()
            .Where(u => referencedUserIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName!, cancellationToken);

        return rows.Select(f => new FeeWeightListItem(
            f.Id,
            (int)f.OrderType,
            f.FromWarehouseId,
            warehouseNames.GetValueOrDefault(f.FromWarehouseId, "—"),
            f.ToWarehouseId,
            warehouseNames.GetValueOrDefault(f.ToWarehouseId, "—"),
            f.WeightFrom,
            f.WeightTo,
            f.Price,
            f.ShippingMethodId,
            shippingMethodNames.GetValueOrDefault(f.ShippingMethodId, "—"),
            f.IsActive,
            f.CreatedAtUtc,
            f.CreatedByUserId is { } createdById ? usernames.GetValueOrDefault(createdById) : null,
            f.UpdatedAtUtc,
            f.UpdatedByUserId is { } updatedById ? usernames.GetValueOrDefault(updatedById) : null))
            .ToList();
    }
}
