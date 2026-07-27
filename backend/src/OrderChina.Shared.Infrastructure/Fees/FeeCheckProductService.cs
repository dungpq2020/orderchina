using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Fees;
using OrderChina.Shared.Application.Fees.Dtos;
using OrderChina.Shared.Domain.Fees;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.Shared.Infrastructure.Fees;

public class FeeCheckProductService : IFeeCheckProductService
{
    private readonly AppDbContext _dbContext;

    public FeeCheckProductService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<FeeCheckProductListResult> GetListAsync(int priceTier, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 20 : pageSize;

        var query = _dbContext.FeeCheckProducts
            .AsNoTracking()
            .Where(f => !f.IsDeleted && (int)f.PriceTier == priceTier);

        var totalCount = await query.CountAsync(cancellationToken);

        var rows = await query
            .OrderBy(f => f.QuantityFrom)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = await MapToListItemsAsync(rows, cancellationToken);

        return new FeeCheckProductListResult(items, totalCount, page, pageSize);
    }

    public async Task<FeeCheckProductResult> CreateAsync(SaveFeeCheckProductRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var validationError = Validate(request);
        if (validationError is not null)
        {
            return new FeeCheckProductResult(false, validationError, null);
        }

        var entity = new FeeCheckProduct
        {
            Id = Guid.NewGuid(),
            PriceTier = (FeeCheckProductPriceTier)request.PriceTier,
            QuantityFrom = request.QuantityFrom,
            QuantityTo = request.QuantityTo,
            Price = request.Price,
            IsActive = request.IsActive,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedByUserId = actingUserId,
        };

        _dbContext.FeeCheckProducts.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var item = (await MapToListItemsAsync([entity], cancellationToken))[0];
        return new FeeCheckProductResult(true, null, item);
    }

    public async Task<FeeCheckProductResult> UpdateAsync(Guid id, SaveFeeCheckProductRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var validationError = Validate(request);
        if (validationError is not null)
        {
            return new FeeCheckProductResult(false, validationError, null);
        }

        var entity = await _dbContext.FeeCheckProducts.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (entity is null)
        {
            return new FeeCheckProductResult(false, "Không tìm thấy bậc phí.", null);
        }

        entity.PriceTier = (FeeCheckProductPriceTier)request.PriceTier;
        entity.QuantityFrom = request.QuantityFrom;
        entity.QuantityTo = request.QuantityTo;
        entity.Price = request.Price;
        entity.IsActive = request.IsActive;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedByUserId = actingUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var item = (await MapToListItemsAsync([entity], cancellationToken))[0];
        return new FeeCheckProductResult(true, null, item);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.FeeCheckProducts.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
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

    private static string? Validate(SaveFeeCheckProductRequest request)
    {
        if (!Enum.IsDefined(typeof(FeeCheckProductPriceTier), request.PriceTier))
        {
            return "Bậc giá không hợp lệ.";
        }

        if (request.QuantityFrom < 0 || request.QuantityTo < 0 || request.Price < 0)
        {
            return "Giá trị không được âm.";
        }

        if (request.QuantityTo <= request.QuantityFrom)
        {
            return "Số lượng đến phải lớn hơn số lượng từ.";
        }

        return null;
    }

    private async Task<IReadOnlyList<FeeCheckProductListItem>> MapToListItemsAsync(IReadOnlyList<FeeCheckProduct> rows, CancellationToken cancellationToken)
    {
        var referencedIds = rows
            .SelectMany(f => new[] { f.CreatedByUserId, f.UpdatedByUserId })
            .Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();

        var usernames = await _dbContext.Users
            .AsNoTracking()
            .Where(u => referencedIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName!, cancellationToken);

        return rows.Select(f => new FeeCheckProductListItem(
            f.Id,
            (int)f.PriceTier,
            f.QuantityFrom,
            f.QuantityTo,
            f.Price,
            f.IsActive,
            f.CreatedAtUtc,
            f.CreatedByUserId is { } createdById ? usernames.GetValueOrDefault(createdById) : null,
            f.UpdatedAtUtc,
            f.UpdatedByUserId is { } updatedById ? usernames.GetValueOrDefault(updatedById) : null))
            .ToList();
    }
}
