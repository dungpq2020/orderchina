using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Fees;
using OrderChina.Shared.Application.Fees.Dtos;
using OrderChina.Shared.Domain.Fees;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.Shared.Infrastructure.Fees;

public class UserLevelService : IUserLevelService
{
    private readonly AppDbContext _dbContext;

    public UserLevelService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<UserLevelListItem>> GetListAsync(CancellationToken cancellationToken = default)
    {
        var rows = await _dbContext.UserLevels
            .AsNoTracking()
            .Where(l => !l.IsDeleted)
            .OrderBy(l => l.Rank)
            .ToListAsync(cancellationToken);

        return await MapToListItemsAsync(rows, cancellationToken);
    }

    public async Task<UserLevelResult> CreateAsync(CreateUserLevelRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return new UserLevelResult(false, "Vui lòng nhập tên cấp độ.", null);
        }

        if (request.Rank <= 0)
        {
            return new UserLevelResult(false, "Thứ tự bậc phải lớn hơn 0.", null);
        }

        if (request.PurchaseFeeDiscountPercent < 0 || request.ShippingFeeDiscountPercent < 0 || request.MinDepositPercent < 0)
        {
            return new UserLevelResult(false, "Phần trăm không được âm.", null);
        }

        var rankTaken = await _dbContext.UserLevels.AnyAsync(l => l.Rank == request.Rank && !l.IsDeleted, cancellationToken);
        if (rankTaken)
        {
            return new UserLevelResult(false, "Thứ tự bậc đã được sử dụng.", null);
        }

        var entity = new UserLevel
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Rank = request.Rank,
            PurchaseFeeDiscountPercent = request.PurchaseFeeDiscountPercent,
            ShippingFeeDiscountPercent = request.ShippingFeeDiscountPercent,
            MinDepositPercent = request.MinDepositPercent,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedByUserId = actingUserId,
        };

        _dbContext.UserLevels.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var item = (await MapToListItemsAsync([entity], cancellationToken))[0];
        return new UserLevelResult(true, null, item);
    }

    public async Task<UserLevelResult> UpdateAsync(Guid id, UpdateUserLevelRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        if (request.PurchaseFeeDiscountPercent < 0 || request.ShippingFeeDiscountPercent < 0 || request.MinDepositPercent < 0)
        {
            return new UserLevelResult(false, "Phần trăm không được âm.", null);
        }

        var entity = await _dbContext.UserLevels.FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
        if (entity is null)
        {
            return new UserLevelResult(false, "Không tìm thấy cấp độ.", null);
        }

        entity.PurchaseFeeDiscountPercent = request.PurchaseFeeDiscountPercent;
        entity.ShippingFeeDiscountPercent = request.ShippingFeeDiscountPercent;
        entity.MinDepositPercent = request.MinDepositPercent;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedByUserId = actingUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var item = (await MapToListItemsAsync([entity], cancellationToken))[0];
        return new UserLevelResult(true, null, item);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.UserLevels.FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
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

    private async Task<IReadOnlyList<UserLevelListItem>> MapToListItemsAsync(IReadOnlyList<UserLevel> rows, CancellationToken cancellationToken)
    {
        var referencedIds = rows
            .SelectMany(l => new[] { l.CreatedByUserId, l.UpdatedByUserId })
            .Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();

        var usernames = await _dbContext.Users
            .AsNoTracking()
            .Where(u => referencedIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName!, cancellationToken);

        return rows.Select(l => new UserLevelListItem(
            l.Id,
            l.Name,
            l.Rank,
            l.PurchaseFeeDiscountPercent,
            l.ShippingFeeDiscountPercent,
            l.MinDepositPercent,
            l.IsActive,
            l.CreatedAtUtc,
            l.CreatedByUserId is { } createdById ? usernames.GetValueOrDefault(createdById) : null,
            l.UpdatedAtUtc,
            l.UpdatedByUserId is { } updatedById ? usernames.GetValueOrDefault(updatedById) : null))
            .ToList();
    }
}
