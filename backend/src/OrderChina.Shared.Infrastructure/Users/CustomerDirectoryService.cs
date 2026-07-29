using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Users;
using OrderChina.Shared.Application.Users.Dtos;
using OrderChina.Shared.Domain.Identity;
using OrderChina.Shared.Domain.Shipping;
using OrderChina.Shared.Domain.Warehouses;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.Shared.Infrastructure.Users;

public class CustomerDirectoryService : ICustomerDirectoryService
{
    private readonly AppDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;

    public CustomerDirectoryService(AppDbContext dbContext, UserManager<ApplicationUser> userManager)
    {
        _dbContext = dbContext;
        _userManager = userManager;
    }

    public async Task<CustomerListResult> GetCustomersAsync(int page, int pageSize, CustomerListFilter filter, CancellationToken cancellationToken = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 20 : pageSize;

        var query = _dbContext.Users
            .AsNoTracking()
            .Where(u => u.UserType == UserType.Customer);

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

        if (filter.Tier is { } tier)
        {
            query = query.Where(u => u.Tier == tier);
        }

        if (filter.SalesStaffId is { } salesStaffId)
        {
            query = query.Where(u => u.SalesStaffId == salesStaffId);
        }

        if (filter.OrderStaffId is { } orderStaffId)
        {
            query = query.Where(u => u.OrderStaffId == orderStaffId);
        }

        if (filter.ChinaWarehouseId is { } chinaWarehouseId)
        {
            query = query.Where(u => u.ChinaWarehouseId == chinaWarehouseId);
        }

        if (filter.VietnamWarehouseId is { } vietnamWarehouseId)
        {
            query = query.Where(u => u.VietnamWarehouseId == vietnamWarehouseId);
        }

        if (filter.ShippingMethodId is { } shippingMethodId)
        {
            query = query.Where(u => u.ShippingMethodId == shippingMethodId);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var users = await query
            .OrderByDescending(u => u.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var staffIds = users
            .SelectMany(u => new[] { u.SalesStaffId, u.OrderStaffId, u.CreatedByUserId, u.UpdatedByUserId })
            .Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
        var warehouseIds = users.SelectMany(u => new[] { u.ChinaWarehouseId, u.VietnamWarehouseId }).Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
        var shippingMethodIds = users.Where(u => u.ShippingMethodId.HasValue).Select(u => u.ShippingMethodId!.Value).Distinct().ToList();

        var staffNames = await _dbContext.Users
            .AsNoTracking()
            .Where(u => staffIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName!, cancellationToken);

        var warehouseNames = await _dbContext.Warehouses
            .AsNoTracking()
            .Where(w => warehouseIds.Contains(w.Id))
            .ToDictionaryAsync(w => w.Id, w => w.Name, cancellationToken);

        var shippingMethodNames = await _dbContext.ShippingMethods
            .AsNoTracking()
            .Where(s => shippingMethodIds.Contains(s.Id))
            .ToDictionaryAsync(s => s.Id, s => s.Name, cancellationToken);

        var items = users
            .Select(u => ToListItem(u, staffNames, warehouseNames, shippingMethodNames))
            .ToList();

        return new CustomerListResult(items, totalCount, page, pageSize);
    }

    public async Task<UpdateCustomerResult> UpdateCustomerAsync(Guid id, UpdateCustomerRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == id && u.UserType == UserType.Customer, cancellationToken);
        if (user is null)
        {
            return new UpdateCustomerResult(false, "Không tìm thấy khách hàng.", null);
        }

        if (!Enum.IsDefined(typeof(Role), request.Role))
        {
            return new UpdateCustomerResult(false, "Quyền hạn không hợp lệ.", null);
        }

        var newRole = (Role)request.Role;

        if (newRole == Role.Admin)
        {
            // Endpoint này chỉ dùng để quản lý khách hàng — tuyệt đối không cấp quyền Admin
            // từ đây dù người gọi có là Admin hay không (cấp quyền Admin phải qua luồng riêng).
            return new UpdateCustomerResult(false, "Không thể cấp quyền Admin từ danh sách khách hàng.", null);
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var emailTaken = await _dbContext.Users.AnyAsync(u => u.Id != id && u.Email == request.Email, cancellationToken);
            if (emailTaken)
            {
                return new UpdateCustomerResult(false, "Email đã được sử dụng.", null);
            }
        }

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            var phoneTaken = await _dbContext.Users.AnyAsync(u => u.Id != id && u.PhoneNumber == request.PhoneNumber, cancellationToken);
            if (phoneTaken)
            {
                return new UpdateCustomerResult(false, "Số điện thoại đã được sử dụng.", null);
            }
        }

        if (!string.IsNullOrEmpty(request.NewPassword) && !IsStrongPassword(request.NewPassword))
        {
            return new UpdateCustomerResult(
                false,
                "Mật khẩu mới phải có ít nhất 8 ký tự, gồm hoa, thường, số và ký tự đặc biệt.",
                null);
        }

        if (request.SalesStaffId is { } salesStaffId && !await IsValidStaffAsync(salesStaffId, cancellationToken))
        {
            return new UpdateCustomerResult(false, "Nhân viên kinh doanh không hợp lệ.", null);
        }

        if (request.OrderStaffId is { } orderStaffId && !await IsValidStaffAsync(orderStaffId, cancellationToken))
        {
            return new UpdateCustomerResult(false, "Nhân viên đặt hàng không hợp lệ.", null);
        }

        if (request.ChinaWarehouseId is { } chinaWarehouseId && !await IsValidWarehouseAsync(chinaWarehouseId, WarehouseType.China, cancellationToken))
        {
            return new UpdateCustomerResult(false, "Kho Trung Quốc không hợp lệ.", null);
        }

        if (request.VietnamWarehouseId is { } vietnamWarehouseId && !await IsValidWarehouseAsync(vietnamWarehouseId, WarehouseType.Vietnam, cancellationToken))
        {
            return new UpdateCustomerResult(false, "Kho Việt Nam không hợp lệ.", null);
        }

        if (request.ShippingMethodId is { } shippingMethodId
            && !await _dbContext.ShippingMethods.AnyAsync(s => s.Id == shippingMethodId, cancellationToken))
        {
            return new UpdateCustomerResult(false, "Phương thức vận chuyển không hợp lệ.", null);
        }

        if (!Enum.IsDefined(typeof(AccountStatus), request.Status))
        {
            return new UpdateCustomerResult(false, "Trạng thái tài khoản không hợp lệ.", null);
        }

        user.FullName = request.FullName;
        user.Email = request.Email;
        user.PhoneNumber = request.PhoneNumber;
        user.Address = request.Address;
        user.Tier = request.Tier;
        user.CustomExchangeRate = request.CustomExchangeRate;
        user.CustomPurchaseFeePercent = request.CustomPurchaseFeePercent;
        user.CustomWeightFeePerKg = request.CustomWeightFeePerKg;
        user.CustomVolumeFeePerCbm = request.CustomVolumeFeePerCbm;
        user.CustomMinDepositPercent = request.CustomMinDepositPercent;
        user.SalesStaffId = request.SalesStaffId;
        user.OrderStaffId = request.OrderStaffId;
        user.ChinaWarehouseId = request.ChinaWarehouseId;
        user.VietnamWarehouseId = request.VietnamWarehouseId;
        user.ShippingMethodId = request.ShippingMethodId;
        user.Status = (AccountStatus)request.Status;
        user.Role = newRole;
        user.UserType = newRole == Role.Customer ? UserType.Customer : UserType.Staff;
        user.UpdatedAtUtc = DateTime.UtcNow;
        user.UpdatedByUserId = actingUserId;

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            var error = string.Join("; ", updateResult.Errors.Select(e => e.Description));
            return new UpdateCustomerResult(false, error, null);
        }

        if (!string.IsNullOrEmpty(request.NewPassword))
        {
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var resetResult = await _userManager.ResetPasswordAsync(user, resetToken, request.NewPassword);
            if (!resetResult.Succeeded)
            {
                var error = string.Join("; ", resetResult.Errors.Select(e => e.Description));
                return new UpdateCustomerResult(false, error, null);
            }
        }

        return new UpdateCustomerResult(true, null, await ToListItemAsync(user, cancellationToken));
    }

    public async Task<WalletAdjustResult> AdjustWalletAsync(Guid id, WalletAdjustRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Amount == 0)
        {
            return new WalletAdjustResult(false, "Số tiền điều chỉnh phải khác 0.", null);
        }

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return new WalletAdjustResult(false, "Vui lòng nhập lý do điều chỉnh.", null);
        }

        var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == id && u.UserType == UserType.Customer, cancellationToken);
        if (user is null)
        {
            return new WalletAdjustResult(false, "Không tìm thấy khách hàng.", null);
        }

        var newBalance = user.WalletBalance + request.Amount;
        if (newBalance < 0)
        {
            return new WalletAdjustResult(false, "Số dư ví không đủ.", null);
        }

        user.WalletBalance = newBalance;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new WalletAdjustResult(true, null, user.WalletBalance);
    }

    public async Task<IReadOnlyList<CustomerSearchItem>> SearchCustomersAsync(string query, CancellationToken cancellationToken = default)
    {
        query = query.Trim();
        if (query.Length == 0)
        {
            return Array.Empty<CustomerSearchItem>();
        }

        var pattern = $"%{query}%";

        var users = await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.UserType == UserType.Customer
                && (EF.Functions.ILike(u.UserName!, pattern) || EF.Functions.ILike(u.FullName, pattern)))
            .OrderBy(u => u.UserName)
            .Take(20)
            .ToListAsync(cancellationToken);

        return users
            .Select(u => new CustomerSearchItem(u.Id, u.UserName!, u.FullName, u.WalletBalance, u.ChinaWarehouseId, u.VietnamWarehouseId, u.ShippingMethodId))
            .ToList();
    }

    private Task<bool> IsValidStaffAsync(Guid staffId, CancellationToken cancellationToken)
    {
        return _dbContext.Users.AnyAsync(u => u.Id == staffId && u.UserType == UserType.Staff, cancellationToken);
    }

    private Task<bool> IsValidWarehouseAsync(Guid warehouseId, WarehouseType type, CancellationToken cancellationToken)
    {
        return _dbContext.Warehouses.AnyAsync(w => w.Id == warehouseId && w.Type == type, cancellationToken);
    }

    private async Task<CustomerListItem> ToListItemAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        string? salesStaffName = user.SalesStaffId is { } salesId
            ? await _dbContext.Users.Where(u => u.Id == salesId).Select(u => u.UserName).FirstOrDefaultAsync(cancellationToken)
            : null;
        string? orderStaffName = user.OrderStaffId is { } orderId
            ? await _dbContext.Users.Where(u => u.Id == orderId).Select(u => u.UserName).FirstOrDefaultAsync(cancellationToken)
            : null;
        string? chinaWarehouseName = user.ChinaWarehouseId is { } chinaId
            ? await _dbContext.Warehouses.Where(w => w.Id == chinaId).Select(w => w.Name).FirstOrDefaultAsync(cancellationToken)
            : null;
        string? vietnamWarehouseName = user.VietnamWarehouseId is { } vnId
            ? await _dbContext.Warehouses.Where(w => w.Id == vnId).Select(w => w.Name).FirstOrDefaultAsync(cancellationToken)
            : null;
        string? shippingMethodName = user.ShippingMethodId is { } shippingId
            ? await _dbContext.ShippingMethods.Where(s => s.Id == shippingId).Select(s => s.Name).FirstOrDefaultAsync(cancellationToken)
            : null;
        string? createdByUsername = user.CreatedByUserId is { } createdById
            ? await _dbContext.Users.Where(u => u.Id == createdById).Select(u => u.UserName).FirstOrDefaultAsync(cancellationToken)
            : null;
        string? updatedByUsername = user.UpdatedByUserId is { } updatedById
            ? await _dbContext.Users.Where(u => u.Id == updatedById).Select(u => u.UserName).FirstOrDefaultAsync(cancellationToken)
            : null;

        return new CustomerListItem(
            user.Id,
            user.UserName!,
            user.Email,
            user.PhoneNumber,
            user.FullName,
            user.Address,
            user.Tier,
            user.WalletBalance,
            user.CustomExchangeRate,
            user.CustomPurchaseFeePercent,
            user.CustomWeightFeePerKg,
            user.CustomVolumeFeePerCbm,
            user.CustomMinDepositPercent,
            user.SalesStaffId,
            salesStaffName,
            user.OrderStaffId,
            orderStaffName,
            user.ChinaWarehouseId,
            chinaWarehouseName,
            user.VietnamWarehouseId,
            vietnamWarehouseName,
            user.ShippingMethodId,
            shippingMethodName,
            user.UserType.ToString(),
            (int)user.Status,
            (int)user.Role,
            user.CreatedAtUtc,
            createdByUsername,
            user.UpdatedAtUtc,
            updatedByUsername);
    }

    private static CustomerListItem ToListItem(
        ApplicationUser user,
        IReadOnlyDictionary<Guid, string> staffNames,
        IReadOnlyDictionary<Guid, string> warehouseNames,
        IReadOnlyDictionary<Guid, string> shippingMethodNames) => new(
        user.Id,
        user.UserName!,
        user.Email,
        user.PhoneNumber,
        user.FullName,
        user.Address,
        user.Tier,
        user.WalletBalance,
        user.CustomExchangeRate,
        user.CustomPurchaseFeePercent,
        user.CustomWeightFeePerKg,
        user.CustomVolumeFeePerCbm,
        user.CustomMinDepositPercent,
        user.SalesStaffId,
        user.SalesStaffId is { } salesId ? staffNames.GetValueOrDefault(salesId) : null,
        user.OrderStaffId,
        user.OrderStaffId is { } orderId ? staffNames.GetValueOrDefault(orderId) : null,
        user.ChinaWarehouseId,
        user.ChinaWarehouseId is { } chinaId ? warehouseNames.GetValueOrDefault(chinaId) : null,
        user.VietnamWarehouseId,
        user.VietnamWarehouseId is { } vnId ? warehouseNames.GetValueOrDefault(vnId) : null,
        user.ShippingMethodId,
        user.ShippingMethodId is { } shippingId ? shippingMethodNames.GetValueOrDefault(shippingId) : null,
        user.UserType.ToString(),
        (int)user.Status,
        (int)user.Role,
        user.CreatedAtUtc,
        user.CreatedByUserId is { } createdById ? staffNames.GetValueOrDefault(createdById) : null,
        user.UpdatedAtUtc,
        user.UpdatedByUserId is { } updatedById ? staffNames.GetValueOrDefault(updatedById) : null);

    private static bool IsStrongPassword(string password)
    {
        return password.Length >= 8
            && Regex.IsMatch(password, "[A-Z]")
            && Regex.IsMatch(password, "[a-z]")
            && Regex.IsMatch(password, "[0-9]")
            && Regex.IsMatch(password, "[^a-zA-Z0-9]");
    }
}
