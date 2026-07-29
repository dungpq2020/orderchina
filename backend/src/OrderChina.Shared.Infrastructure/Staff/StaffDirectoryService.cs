using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Staff;
using OrderChina.Shared.Application.Staff.Dtos;
using OrderChina.Shared.Domain.Identity;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.Shared.Infrastructure.Staff;

public class StaffDirectoryService : IStaffDirectoryService
{
    private readonly AppDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;

    public StaffDirectoryService(AppDbContext dbContext, UserManager<ApplicationUser> userManager)
    {
        _dbContext = dbContext;
        _userManager = userManager;
    }

    public async Task<IReadOnlyList<StaffListItem>> GetStaffAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.UserType == UserType.Staff)
            .OrderBy(u => u.FullName)
            .Select(u => new StaffListItem(u.Id, u.UserName!, u.FullName, (int)u.Role))
            .ToListAsync(cancellationToken);
    }

    public Task<StaffDirectoryListResult> GetStaffListAsync(int page, int pageSize, StaffListFilter filter, CancellationToken cancellationToken = default) =>
        GetListAsync(u => u.UserType == UserType.Staff && u.Role != Role.Admin, filter, page, pageSize, cancellationToken);

    public Task<StaffDirectoryListResult> GetAdminsAsync(int page, int pageSize, StaffListFilter filter, CancellationToken cancellationToken = default) =>
        GetListAsync(u => u.UserType == UserType.Staff && u.Role == Role.Admin, filter, page, pageSize, cancellationToken);

    private async Task<StaffDirectoryListResult> GetListAsync(
        System.Linq.Expressions.Expression<Func<ApplicationUser, bool>> predicate,
        StaffListFilter filter,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 20 : pageSize;

        var query = _dbContext.Users.AsNoTracking().Where(predicate);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var pattern = $"%{filter.Search.Trim()}%";
            query = query.Where(u =>
                EF.Functions.ILike(u.UserName!, pattern) ||
                EF.Functions.ILike(u.FullName, pattern) ||
                (u.PhoneNumber != null && EF.Functions.ILike(u.PhoneNumber, pattern)) ||
                (u.Email != null && EF.Functions.ILike(u.Email, pattern)));
        }

        if (filter.Status is { } status)
        {
            query = query.Where(u => (int)u.Status == status);
        }

        if (filter.Role is { } role)
        {
            query = query.Where(u => (int)u.Role == role);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var users = await query
            .OrderByDescending(u => u.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var referencedIds = users
            .SelectMany(u => new[] { u.CreatedByUserId, u.UpdatedByUserId })
            .Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();

        var usernames = await _dbContext.Users
            .AsNoTracking()
            .Where(u => referencedIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName!, cancellationToken);

        var items = users.Select(u => new StaffDirectoryListItem(
            u.Id,
            u.UserName!,
            u.Email,
            u.PhoneNumber,
            u.FullName,
            u.Address,
            (int)u.Role,
            (int)u.Status,
            u.WalletBalance,
            u.CreatedAtUtc,
            u.CreatedByUserId is { } createdById ? usernames.GetValueOrDefault(createdById) : null,
            u.UpdatedAtUtc,
            u.UpdatedByUserId is { } updatedById ? usernames.GetValueOrDefault(updatedById) : null))
            .ToList();

        return new StaffDirectoryListResult(items, totalCount, page, pageSize);
    }

    public async Task<UpdateStaffResult> UpdateStaffAsync(Guid id, UpdateStaffRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == id && u.UserType == UserType.Staff && u.Role != Role.Admin, cancellationToken);
        if (user is null)
        {
            return new UpdateStaffResult(false, "Không tìm thấy nhân viên.", null);
        }

        return await ApplyUpdateAsync(user, request, actingUserId, requireActingAdmin: false, cancellationToken);
    }

    public async Task<UpdateStaffResult> UpdateAdminAsync(Guid id, UpdateStaffRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == id && u.UserType == UserType.Staff && u.Role == Role.Admin, cancellationToken);
        if (user is null)
        {
            return new UpdateStaffResult(false, "Không tìm thấy admin.", null);
        }

        return await ApplyUpdateAsync(user, request, actingUserId, requireActingAdmin: true, cancellationToken);
    }

    private async Task<UpdateStaffResult> ApplyUpdateAsync(
        ApplicationUser user,
        UpdateStaffRequest request,
        Guid actingUserId,
        bool requireActingAdmin,
        CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(typeof(Role), request.Role))
        {
            return new UpdateStaffResult(false, "Quyền hạn không hợp lệ.", null);
        }

        if (!Enum.IsDefined(typeof(AccountStatus), request.Status))
        {
            return new UpdateStaffResult(false, "Trạng thái tài khoản không hợp lệ.", null);
        }

        var newRole = (Role)request.Role;
        var id = user.Id;

        if (requireActingAdmin || (newRole == Role.Admin && newRole != user.Role))
        {
            // Chỉ Admin mới có quyền sửa tài khoản Admin, hoặc nâng người khác lên Admin.
            var actingUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == actingUserId, cancellationToken);
            if (actingUser is null || actingUser.Role != Role.Admin)
            {
                return new UpdateStaffResult(false, "Chỉ Admin mới có thể thực hiện thao tác này.", null);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var emailTaken = await _dbContext.Users.AnyAsync(u => u.Id != id && u.Email == request.Email, cancellationToken);
            if (emailTaken)
            {
                return new UpdateStaffResult(false, "Email đã được sử dụng.", null);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            var phoneTaken = await _dbContext.Users.AnyAsync(u => u.Id != id && u.PhoneNumber == request.PhoneNumber, cancellationToken);
            if (phoneTaken)
            {
                return new UpdateStaffResult(false, "Số điện thoại đã được sử dụng.", null);
            }
        }

        if (!string.IsNullOrEmpty(request.NewPassword) && !IsStrongPassword(request.NewPassword))
        {
            return new UpdateStaffResult(
                false,
                "Mật khẩu mới phải có ít nhất 8 ký tự, gồm hoa, thường, số và ký tự đặc biệt.",
                null);
        }

        user.FullName = request.FullName;
        user.Email = request.Email;
        user.PhoneNumber = request.PhoneNumber;
        user.Address = request.Address;
        user.Status = (AccountStatus)request.Status;
        user.Role = newRole;
        user.UserType = newRole == Role.Customer ? UserType.Customer : UserType.Staff;
        user.UpdatedAtUtc = DateTime.UtcNow;
        user.UpdatedByUserId = actingUserId;

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            var error = string.Join("; ", updateResult.Errors.Select(e => e.Description));
            return new UpdateStaffResult(false, error, null);
        }

        if (!string.IsNullOrEmpty(request.NewPassword))
        {
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var resetResult = await _userManager.ResetPasswordAsync(user, resetToken, request.NewPassword);
            if (!resetResult.Succeeded)
            {
                var error = string.Join("; ", resetResult.Errors.Select(e => e.Description));
                return new UpdateStaffResult(false, error, null);
            }
        }

        string? createdByUsername = user.CreatedByUserId is { } createdById
            ? await _dbContext.Users.Where(u => u.Id == createdById).Select(u => u.UserName).FirstOrDefaultAsync(cancellationToken)
            : null;
        string? updatedByUsername = user.UpdatedByUserId is { } updatedById
            ? await _dbContext.Users.Where(u => u.Id == updatedById).Select(u => u.UserName).FirstOrDefaultAsync(cancellationToken)
            : null;

        var updated = new StaffDirectoryListItem(
            user.Id, user.UserName!, user.Email, user.PhoneNumber, user.FullName, user.Address,
            (int)user.Role, (int)user.Status, user.WalletBalance, user.CreatedAtUtc,
            createdByUsername, user.UpdatedAtUtc, updatedByUsername);

        return new UpdateStaffResult(true, null, updated);
    }

    private static bool IsStrongPassword(string password)
    {
        return password.Length >= 8
            && Regex.IsMatch(password, "[A-Z]")
            && Regex.IsMatch(password, "[a-z]")
            && Regex.IsMatch(password, "[0-9]")
            && Regex.IsMatch(password, "[^a-zA-Z0-9]");
    }
}
