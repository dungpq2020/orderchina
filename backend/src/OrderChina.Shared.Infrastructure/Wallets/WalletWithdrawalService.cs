using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Wallets;
using OrderChina.Shared.Application.Wallets.Dtos;
using OrderChina.Shared.Domain.Wallets;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.Shared.Infrastructure.Wallets;

public class WalletWithdrawalService : IWalletWithdrawalService
{
    private readonly AppDbContext _dbContext;

    public WalletWithdrawalService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<WalletWithdrawalResult> CreateAsync(CreateWalletWithdrawalRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        if (request.Amount <= 0)
        {
            return new WalletWithdrawalResult(false, "Số tiền rút phải lớn hơn 0.", null);
        }

        if (!Enum.IsDefined(typeof(WalletWithdrawalStatus), request.Status))
        {
            return new WalletWithdrawalResult(false, "Trạng thái không hợp lệ.", null);
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
        if (user is null)
        {
            return new WalletWithdrawalResult(false, "Không tìm thấy khách hàng.", null);
        }

        var status = (WalletWithdrawalStatus)request.Status;

        if (status == WalletWithdrawalStatus.Approved && user.WalletBalance < request.Amount)
        {
            return new WalletWithdrawalResult(false, "Số dư ví không đủ để rút.", null);
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        var withdrawal = new WalletWithdrawal
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            Amount = request.Amount,
            BankName = request.BankName,
            BankAccountNumber = request.BankAccountNumber,
            BankAccountHolderName = request.BankAccountHolderName,
            Note = request.Note,
            Status = status,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedByUserId = actingUserId,
        };
        _dbContext.WalletWithdrawals.Add(withdrawal);

        if (status == WalletWithdrawalStatus.Approved)
        {
            withdrawal.ApprovedAtUtc = withdrawal.CreatedAtUtc;
            withdrawal.ApprovedByUserId = actingUserId;

            user.WalletBalance -= request.Amount;

            _dbContext.WalletTransactions.Add(new WalletTransaction
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                Amount = -request.Amount,
                BalanceAfter = user.WalletBalance,
                Type = WalletTransactionType.Withdrawal,
                ReferenceId = withdrawal.Id,
                Description = request.Note,
                CreatedAtUtc = DateTime.UtcNow,
                CreatedByUserId = actingUserId,
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new WalletWithdrawalResult(true, null, user.WalletBalance);
    }

    public async Task<WalletWithdrawalResult> ApproveAsync(Guid id, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var withdrawal = await _dbContext.WalletWithdrawals.FirstOrDefaultAsync(w => w.Id == id, cancellationToken);
        if (withdrawal is null)
        {
            return new WalletWithdrawalResult(false, "Không tìm thấy yêu cầu rút.", null);
        }

        if (withdrawal.Status == WalletWithdrawalStatus.Approved)
        {
            return new WalletWithdrawalResult(false, "Yêu cầu này đã được duyệt trước đó.", null);
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == withdrawal.UserId, cancellationToken);
        if (user is null)
        {
            return new WalletWithdrawalResult(false, "Không tìm thấy khách hàng.", null);
        }

        if (user.WalletBalance < withdrawal.Amount)
        {
            return new WalletWithdrawalResult(false, "Số dư ví không đủ để duyệt yêu cầu rút này.", null);
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        withdrawal.Status = WalletWithdrawalStatus.Approved;
        withdrawal.ApprovedAtUtc = DateTime.UtcNow;
        withdrawal.ApprovedByUserId = actingUserId;

        user.WalletBalance -= withdrawal.Amount;

        _dbContext.WalletTransactions.Add(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            UserId = withdrawal.UserId,
            Amount = -withdrawal.Amount,
            BalanceAfter = user.WalletBalance,
            Type = WalletTransactionType.Withdrawal,
            ReferenceId = withdrawal.Id,
            Description = withdrawal.Note,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedByUserId = actingUserId,
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        return new WalletWithdrawalResult(true, null, user.WalletBalance);
    }

    public async Task<IReadOnlyList<WalletWithdrawalListItem>> GetHistoryAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var rows = await _dbContext.WalletWithdrawals
            .AsNoTracking()
            .Where(w => w.UserId == userId)
            .OrderByDescending(w => w.CreatedAtUtc)
            .Take(50)
            .ToListAsync(cancellationToken);

        var createdByIds = rows.Select(w => w.CreatedByUserId).Distinct().ToList();
        var usernames = await _dbContext.Users
            .AsNoTracking()
            .Where(u => createdByIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName!, cancellationToken);

        return rows.Select(w => new WalletWithdrawalListItem(
            w.Id,
            w.UserId,
            w.Amount,
            w.BankName,
            w.BankAccountNumber,
            w.BankAccountHolderName,
            w.Note,
            (int)w.Status,
            w.CreatedAtUtc,
            usernames.GetValueOrDefault(w.CreatedByUserId)))
            .ToList();
    }

    public async Task<WalletWithdrawalRequestListResult> GetRequestListAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 20 : pageSize;

        var query = _dbContext.WalletWithdrawals.AsNoTracking();

        var totalCount = await query.CountAsync(cancellationToken);

        var rows = await query
            .OrderByDescending(w => w.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var userIds = rows.Select(w => w.UserId)
            .Concat(rows.Select(w => w.CreatedByUserId))
            .Concat(rows.Where(w => w.ApprovedByUserId.HasValue).Select(w => w.ApprovedByUserId!.Value))
            .Distinct()
            .ToList();
        var usernames = await _dbContext.Users
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName!, cancellationToken);

        var items = rows.Select(w => new WalletWithdrawalRequestListItem(
            w.Id,
            w.UserId,
            usernames.GetValueOrDefault(w.UserId, "—"),
            w.Amount,
            w.BankName,
            w.BankAccountNumber,
            w.BankAccountHolderName,
            w.Note,
            (int)w.Status,
            w.CreatedAtUtc,
            usernames.GetValueOrDefault(w.CreatedByUserId),
            w.ApprovedAtUtc,
            w.ApprovedByUserId is { } approvedById ? usernames.GetValueOrDefault(approvedById) : null))
            .ToList();

        return new WalletWithdrawalRequestListResult(items, totalCount, page, pageSize);
    }
}
