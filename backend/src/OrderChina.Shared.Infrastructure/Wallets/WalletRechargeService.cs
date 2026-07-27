using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Wallets;
using OrderChina.Shared.Application.Wallets.Dtos;
using OrderChina.Shared.Domain.Wallets;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.Shared.Infrastructure.Wallets;

public class WalletRechargeService : IWalletRechargeService
{
    private readonly AppDbContext _dbContext;

    public WalletRechargeService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<WalletRechargeResult> CreateAsync(CreateWalletRechargeRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        if (request.Amount <= 0)
        {
            return new WalletRechargeResult(false, "Số tiền nạp phải lớn hơn 0.", null);
        }

        if (!Enum.IsDefined(typeof(WalletRechargeStatus), request.Status))
        {
            return new WalletRechargeResult(false, "Trạng thái không hợp lệ.", null);
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user is null)
        {
            return new WalletRechargeResult(false, "Không tìm thấy khách hàng.", null);
        }

        if (request.BankAccountId is { } bankAccountId)
        {
            var bankAccountExists = await _dbContext.BankAccounts.AnyAsync(b => b.Id == bankAccountId && !b.IsDeleted, cancellationToken);
            if (!bankAccountExists)
            {
                return new WalletRechargeResult(false, "Tài khoản ngân hàng không hợp lệ.", null);
            }
        }

        var status = (WalletRechargeStatus)request.Status;

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        var recharge = new WalletRecharge
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            BankAccountId = request.BankAccountId,
            Amount = request.Amount,
            Note = request.Note,
            Status = status,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedByUserId = actingUserId,
        };
        _dbContext.WalletRecharges.Add(recharge);

        if (status == WalletRechargeStatus.Approved)
        {
            recharge.ApprovedAtUtc = recharge.CreatedAtUtc;
            recharge.ApprovedByUserId = actingUserId;

            user.WalletBalance += request.Amount;

            _dbContext.WalletTransactions.Add(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                Amount = request.Amount,
                BalanceAfter = user.WalletBalance,
                Type = WalletTransactionType.Recharge,
                ReferenceId = recharge.Id,
                Description = request.Note,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedByUserId = actingUserId,
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new WalletRechargeResult(true, null, user.WalletBalance);
    }

    public async Task<WalletRechargeResult> ApproveAsync(Guid id, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var recharge = await _dbContext.WalletRecharges.FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
        if (recharge is null)
        {
            return new WalletRechargeResult(false, "Không tìm thấy yêu cầu nạp.", null);
        }

        if (recharge.Status == WalletRechargeStatus.Approved)
        {
            return new WalletRechargeResult(false, "Yêu cầu này đã được duyệt trước đó.", null);
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == recharge.UserId, cancellationToken);
        if (user is null)
        {
            return new WalletRechargeResult(false, "Không tìm thấy khách hàng.", null);
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        recharge.Status = WalletRechargeStatus.Approved;
        recharge.ApprovedAtUtc = DateTime.UtcNow;
        recharge.ApprovedByUserId = actingUserId;

        user.WalletBalance += recharge.Amount;

        _dbContext.WalletTransactions.Add(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            UserId = recharge.UserId,
            Amount = recharge.Amount,
            BalanceAfter = user.WalletBalance,
            Type = WalletTransactionType.Recharge,
            ReferenceId = recharge.Id,
            Description = recharge.Note,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedByUserId = actingUserId,
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new WalletRechargeResult(true, null, user.WalletBalance);
    }

    public async Task<IReadOnlyList<WalletRechargeListItem>> GetHistoryAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var rows = await _dbContext.WalletRecharges
            .AsNoTracking()
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAtUtc)
            .Take(50)
            .ToListAsync(cancellationToken);

        var bankAccountIds = rows.Where(r => r.BankAccountId.HasValue).Select(r => r.BankAccountId!.Value).Distinct().ToList();
        var bankNames = await _dbContext.BankAccounts
            .AsNoTracking()
            .Where(b => bankAccountIds.Contains(b.Id))
            .ToDictionaryAsync(b => b.Id, b => b.BankName, cancellationToken);

        var createdByIds = rows.Select(r => r.CreatedByUserId).Distinct().ToList();
        var usernames = await _dbContext.Users
            .AsNoTracking()
            .Where(u => createdByIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName!, cancellationToken);

        return rows.Select(r => new WalletRechargeListItem(
            r.Id,
            r.UserId,
            r.BankAccountId,
            r.BankAccountId is { } bankAccountId ? bankNames.GetValueOrDefault(bankAccountId) : null,
            r.Amount,
            r.Note,
            (int)r.Status,
            r.CreatedAtUtc,
            usernames.GetValueOrDefault(r.CreatedByUserId)))
            .ToList();
    }

    public async Task<WalletTransactionHistoryResult?> GetTransactionHistoryAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
        {
            return null;
        }

        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 20 : pageSize;

        var query = _dbContext.WalletTransactions.AsNoTracking().Where(t => t.UserId == userId);

        var totalCount = await query.CountAsync(cancellationToken);

        var rows = await query
            .OrderByDescending(t => t.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var createdByIds = rows.Select(t => t.CreatedByUserId).Distinct().ToList();
        var usernames = await _dbContext.Users
            .AsNoTracking()
            .Where(u => createdByIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName!, cancellationToken);

        var items = rows.Select(t => new WalletTransactionListItem(
            t.Id,
            t.Amount,
            t.BalanceAfter,
            (int)t.Type,
            t.Description,
            t.CreatedAtUtc,
            usernames.GetValueOrDefault(t.CreatedByUserId)))
            .ToList();

        return new WalletTransactionHistoryResult(user.UserName!, user.WalletBalance, items, totalCount, page, pageSize);
    }

    public async Task<WalletRechargeRequestListResult> GetRequestListAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 20 : pageSize;

        var query = _dbContext.WalletRecharges.AsNoTracking();

        var totalCount = await query.CountAsync(cancellationToken);

        var rows = await query
            .OrderByDescending(r => r.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var bankAccountIds = rows.Where(r => r.BankAccountId.HasValue).Select(r => r.BankAccountId!.Value).Distinct().ToList();
        var bankNames = await _dbContext.BankAccounts
            .AsNoTracking()
            .Where(b => bankAccountIds.Contains(b.Id))
            .ToDictionaryAsync(b => b.Id, b => b.BankName, cancellationToken);

        var userIds = rows.Select(r => r.UserId)
            .Concat(rows.Select(r => r.CreatedByUserId))
            .Concat(rows.Where(r => r.ApprovedByUserId.HasValue).Select(r => r.ApprovedByUserId!.Value))
            .Distinct()
            .ToList();
        var usernames = await _dbContext.Users
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName!, cancellationToken);

        var items = rows.Select(r => new WalletRechargeRequestListItem(
            r.Id,
            r.UserId,
            usernames.GetValueOrDefault(r.UserId, "—"),
            r.BankAccountId,
            r.BankAccountId is { } bankAccountId ? bankNames.GetValueOrDefault(bankAccountId) : null,
            r.Amount,
            r.Note,
            (int)r.Status,
            r.CreatedAtUtc,
            usernames.GetValueOrDefault(r.CreatedByUserId),
            r.ApprovedAtUtc,
            r.ApprovedByUserId is { } approvedById ? usernames.GetValueOrDefault(approvedById) : null))
            .ToList();

        return new WalletRechargeRequestListResult(items, totalCount, page, pageSize);
    }
}
