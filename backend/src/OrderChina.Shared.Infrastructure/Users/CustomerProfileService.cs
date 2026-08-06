using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Users;
using OrderChina.Shared.Application.Users.Dtos;
using OrderChina.Shared.Domain.Identity;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.Shared.Infrastructure.Users;

public class CustomerProfileService : ICustomerProfileService
{
    private readonly AppDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;

    public CustomerProfileService(AppDbContext dbContext, UserManager<ApplicationUser> userManager)
    {
        _dbContext = dbContext;
        _userManager = userManager;
    }

    public async Task<UpdateMyProfileResult> UpdateMyProfileAsync(Guid userId, UpdateMyProfileRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId && u.UserType == UserType.Customer, cancellationToken);
        if (user is null)
        {
            return new UpdateMyProfileResult(false, "Không tìm thấy tài khoản.", null);
        }

        var emailTaken = await _dbContext.Users.AnyAsync(u => u.Id != userId && u.Email == request.Email, cancellationToken);
        if (emailTaken)
        {
            return new UpdateMyProfileResult(false, "Email đã được sử dụng.", null);
        }

        var phoneTaken = await _dbContext.Users.AnyAsync(u => u.Id != userId && u.PhoneNumber == request.PhoneNumber, cancellationToken);
        if (phoneTaken)
        {
            return new UpdateMyProfileResult(false, "Số điện thoại đã được sử dụng.", null);
        }

        user.FullName = request.FullName;
        user.Email = request.Email;
        user.PhoneNumber = request.PhoneNumber;
        user.Address = request.Address;
        user.UpdatedAtUtc = DateTime.UtcNow;

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            var error = string.Join("; ", updateResult.Errors.Select(e => e.Description));
            return new UpdateMyProfileResult(false, error, null);
        }

        return new UpdateMyProfileResult(true, null, await ToProfileAsync(user, cancellationToken));
    }

    private async Task<MyProfile> ToProfileAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var chinaWarehouseName = user.ChinaWarehouseId is { } cwId
            ? await _dbContext.Warehouses.Where(w => w.Id == cwId).Select(w => w.Name).FirstOrDefaultAsync(cancellationToken)
            : null;
        var vietnamWarehouseName = user.VietnamWarehouseId is { } vwId
            ? await _dbContext.Warehouses.Where(w => w.Id == vwId).Select(w => w.Name).FirstOrDefaultAsync(cancellationToken)
            : null;
        var shippingMethodName = user.ShippingMethodId is { } smId
            ? await _dbContext.ShippingMethods.Where(s => s.Id == smId).Select(s => s.Name).FirstOrDefaultAsync(cancellationToken)
            : null;
        var salesStaffName = user.SalesStaffId is { } salesId
            ? await _dbContext.Users.Where(u => u.Id == salesId).Select(u => u.UserName).FirstOrDefaultAsync(cancellationToken)
            : null;

        return new MyProfile(
            user.UserName!,
            user.FullName,
            user.Email,
            user.PhoneNumber,
            user.Address,
            chinaWarehouseName,
            vietnamWarehouseName,
            shippingMethodName,
            salesStaffName);
    }
}
