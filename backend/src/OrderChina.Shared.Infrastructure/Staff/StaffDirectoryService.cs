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

    public async Task<StaffDirectoryListResult> GetStaffListAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 20 : pageSize;

        var query = _dbContext.Users
            .AsNoTracking()
            .Where(u => u.UserType == UserType.Staff);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(u => u.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new StaffDirectoryListItem(
                u.Id,
                u.UserName!,
                u.Email,
                u.PhoneNumber,
                u.FullName,
                (int)u.Role,
                (int)u.Status,
                u.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return new StaffDirectoryListResult(items, totalCount, page, pageSize);
    }

    public async Task<UpdateStaffResult> UpdateStaffAsync(Guid id, UpdateStaffRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == id && u.UserType == UserType.Staff, cancellationToken);
        if (user is null)
        {
            return new UpdateStaffResult(false, "Không tìm thấy nhân viên.", null);
        }

        if (!Enum.IsDefined(typeof(Role), request.Role))
        {
            return new UpdateStaffResult(false, "Quyền hạn không hợp lệ.", null);
        }

        if (!Enum.IsDefined(typeof(AccountStatus), request.Status))
        {
            return new UpdateStaffResult(false, "Trạng thái tài khoản không hợp lệ.", null);
        }

        var newRole = (Role)request.Role;

        if (newRole == Role.Admin && newRole != user.Role)
        {
            // Chỉ Admin mới có quyền nâng 1 nhân viên khác lên Admin.
            var actingUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == actingUserId, cancellationToken);
            if (actingUser is null || actingUser.Role != Role.Admin)
            {
                return new UpdateStaffResult(false, "Chỉ Admin mới có thể cấp quyền Admin.", null);
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
        user.Status = (AccountStatus)request.Status;
        user.Role = newRole;
        user.UserType = newRole == Role.Customer ? UserType.Customer : UserType.Staff;

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

        var updated = new StaffDirectoryListItem(
            user.Id, user.UserName!, user.Email, user.PhoneNumber, user.FullName,
            (int)user.Role, (int)user.Status, user.CreatedAtUtc);

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
