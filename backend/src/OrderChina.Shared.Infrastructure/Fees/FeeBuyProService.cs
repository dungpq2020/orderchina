using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Fees;
using OrderChina.Shared.Application.Fees.Dtos;
using OrderChina.Shared.Domain.Fees;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.Shared.Infrastructure.Fees;

public class FeeBuyProService : IFeeBuyProService
{
    private readonly AppDbContext _dbContext;

    public FeeBuyProService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<FeeBuyProListResult> GetListAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 20 : pageSize;

        var query = _dbContext.FeeBuyPros.AsNoTracking().Where(f => !f.IsDeleted);

        var totalCount = await query.CountAsync(cancellationToken);

        var rows = await query
            .OrderBy(f => f.PriceFrom)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = await MapToListItemsAsync(rows, cancellationToken);

        return new FeeBuyProListResult(items, totalCount, page, pageSize);
    }

    public async Task<FeeBuyProResult> CreateAsync(SaveFeeBuyProRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var validationError = Validate(request);
        if (validationError is not null)
        {
            return new FeeBuyProResult(false, validationError, null);
        }

        var entity = new FeeBuyPro
        {
            Id = Guid.NewGuid(),
            PriceFrom = request.PriceFrom,
            PriceTo = request.PriceTo,
            Percent = request.Percent,
            IsActive = request.IsActive,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedByUserId = actingUserId,
        };

        _dbContext.FeeBuyPros.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var item = (await MapToListItemsAsync([entity], cancellationToken))[0];
        return new FeeBuyProResult(true, null, item);
    }

    public async Task<FeeBuyProResult> UpdateAsync(Guid id, SaveFeeBuyProRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var validationError = Validate(request);
        if (validationError is not null)
        {
            return new FeeBuyProResult(false, validationError, null);
        }

        var entity = await _dbContext.FeeBuyPros.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
        if (entity is null)
        {
            return new FeeBuyProResult(false, "Không tìm thấy bậc phí.", null);
        }

        entity.PriceFrom = request.PriceFrom;
        entity.PriceTo = request.PriceTo;
        entity.Percent = request.Percent;
        entity.IsActive = request.IsActive;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedByUserId = actingUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var item = (await MapToListItemsAsync([entity], cancellationToken))[0];
        return new FeeBuyProResult(true, null, item);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.FeeBuyPros.FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
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

    private static string? Validate(SaveFeeBuyProRequest request)
    {
        if (request.PriceFrom < 0 || request.PriceTo < 0)
        {
            return "Giá trị không được âm.";
        }

        if (request.PriceTo <= request.PriceFrom)
        {
            return "Giá đến phải lớn hơn giá từ.";
        }

        if (request.Percent < 0)
        {
            return "Phần trăm không được âm.";
        }

        return null;
    }

    private async Task<IReadOnlyList<FeeBuyProListItem>> MapToListItemsAsync(IReadOnlyList<FeeBuyPro> rows, CancellationToken cancellationToken)
    {
        var referencedIds = rows
            .SelectMany(f => new[] { f.CreatedByUserId, f.UpdatedByUserId })
            .Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();

        var usernames = await _dbContext.Users
            .AsNoTracking()
            .Where(u => referencedIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName!, cancellationToken);

        return rows.Select(f => new FeeBuyProListItem(
            f.Id,
            f.PriceFrom,
            f.PriceTo,
            f.Percent,
            f.IsActive,
            f.CreatedAtUtc,
            f.CreatedByUserId is { } createdById ? usernames.GetValueOrDefault(createdById) : null,
            f.UpdatedAtUtc,
            f.UpdatedByUserId is { } updatedById ? usernames.GetValueOrDefault(updatedById) : null))
            .ToList();
    }
}
