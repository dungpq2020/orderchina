using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Fees;
using OrderChina.Shared.Application.Fees.Dtos;
using OrderChina.Shared.Domain.Fees;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.Shared.Infrastructure.Fees;

public class BankAccountService : IBankAccountService
{
    private readonly AppDbContext _dbContext;

    public BankAccountService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<BankAccountListItem>> GetListAsync(CancellationToken cancellationToken = default)
    {
        var rows = await _dbContext.BankAccounts
            .AsNoTracking()
            .Where(b => !b.IsDeleted)
            .OrderByDescending(b => b.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        return await MapToListItemsAsync(rows, cancellationToken);
    }

    public async Task<BankAccountResult> CreateAsync(SaveBankAccountRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var validationError = Validate(request);
        if (validationError is not null)
        {
            return new BankAccountResult(false, validationError, null);
        }

        var entity = new BankAccount
        {
            Id = Guid.NewGuid(),
            BankName = request.BankName,
            AccountNumber = request.AccountNumber,
            AccountHolderName = request.AccountHolderName,
            Branch = request.Branch,
            QrCodeUrl = request.QrCodeUrl,
            IsActive = request.IsActive,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedByUserId = actingUserId,
        };

        _dbContext.BankAccounts.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var item = (await MapToListItemsAsync([entity], cancellationToken))[0];
        return new BankAccountResult(true, null, item);
    }

    public async Task<BankAccountResult> UpdateAsync(Guid id, SaveBankAccountRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var validationError = Validate(request);
        if (validationError is not null)
        {
            return new BankAccountResult(false, validationError, null);
        }

        var entity = await _dbContext.BankAccounts.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (entity is null)
        {
            return new BankAccountResult(false, "Không tìm thấy tài khoản ngân hàng.", null);
        }

        entity.BankName = request.BankName;
        entity.AccountNumber = request.AccountNumber;
        entity.AccountHolderName = request.AccountHolderName;
        entity.Branch = request.Branch;
        entity.QrCodeUrl = request.QrCodeUrl;
        entity.IsActive = request.IsActive;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedByUserId = actingUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var item = (await MapToListItemsAsync([entity], cancellationToken))[0];
        return new BankAccountResult(true, null, item);
    }

    public async Task<bool> DeleteAsync(Guid id, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.BankAccounts.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
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

    private static string? Validate(SaveBankAccountRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.BankName))
        {
            return "Vui lòng nhập tên ngân hàng.";
        }

        if (string.IsNullOrWhiteSpace(request.AccountNumber))
        {
            return "Vui lòng nhập số tài khoản.";
        }

        if (string.IsNullOrWhiteSpace(request.AccountHolderName))
        {
            return "Vui lòng nhập tên chủ tài khoản.";
        }

        return null;
    }

    private async Task<IReadOnlyList<BankAccountListItem>> MapToListItemsAsync(IReadOnlyList<BankAccount> rows, CancellationToken cancellationToken)
    {
        var referencedIds = rows
            .SelectMany(b => new[] { b.CreatedByUserId, b.UpdatedByUserId })
            .Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();

        var usernames = await _dbContext.Users
            .AsNoTracking()
            .Where(u => referencedIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName!, cancellationToken);

        return rows.Select(b => new BankAccountListItem(
            b.Id,
            b.BankName,
            b.AccountNumber,
            b.AccountHolderName,
            b.Branch,
            b.QrCodeUrl,
            b.IsActive,
            b.CreatedAtUtc,
            b.CreatedByUserId is { } createdById ? usernames.GetValueOrDefault(createdById) : null,
            b.UpdatedAtUtc,
            b.UpdatedByUserId is { } updatedById ? usernames.GetValueOrDefault(updatedById) : null))
            .ToList();
    }
}
