using System.IdentityModel.Tokens.Jwt;
using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Users;
using OrderChina.Shared.Application.Users.Dtos;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.CustomerApi.Controllers;

/// <summary>Hồ sơ khách hàng đang đăng nhập — dùng cho navbar dashboard (tên, số dư ví, tỷ giá tham khảo)
/// và trang "Tài khoản" (xem/tự cập nhật Họ tên, Email, SĐT, Địa chỉ).</summary>
[ApiController]
[Route("me")]
[Authorize]
public class MeController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly ICustomerProfileService _customerProfileService;
    private readonly IValidator<UpdateMyProfileRequest> _updateProfileValidator;

    public MeController(AppDbContext dbContext, ICustomerProfileService customerProfileService, IValidator<UpdateMyProfileRequest> updateProfileValidator)
    {
        _dbContext = dbContext;
        _customerProfileService = customerProfileService;
        _updateProfileValidator = updateProfileValidator;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var user = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
        {
            return NotFound();
        }

        var config = await _dbContext.SystemConfigs.AsNoTracking().FirstAsync(cancellationToken);
        var exchangeRate = user.CustomExchangeRate is > 0 ? user.CustomExchangeRate.Value : config.PurchaseExchangeRate;

        var chinaWarehouseName = user.ChinaWarehouseId is { } cwId
            ? await _dbContext.Warehouses.AsNoTracking().Where(w => w.Id == cwId).Select(w => w.Name).FirstOrDefaultAsync(cancellationToken)
            : null;
        var vietnamWarehouseName = user.VietnamWarehouseId is { } vwId
            ? await _dbContext.Warehouses.AsNoTracking().Where(w => w.Id == vwId).Select(w => w.Name).FirstOrDefaultAsync(cancellationToken)
            : null;
        var shippingMethodName = user.ShippingMethodId is { } smId
            ? await _dbContext.ShippingMethods.AsNoTracking().Where(s => s.Id == smId).Select(s => s.Name).FirstOrDefaultAsync(cancellationToken)
            : null;
        var salesStaffName = user.SalesStaffId is { } salesId
            ? await _dbContext.Users.AsNoTracking().Where(u => u.Id == salesId).Select(u => u.UserName).FirstOrDefaultAsync(cancellationToken)
            : null;

        return Ok(new
        {
            username = user.UserName,
            fullName = user.FullName,
            email = user.Email,
            phoneNumber = user.PhoneNumber,
            address = user.Address,
            walletBalance = user.WalletBalance,
            exchangeRate,
            hotline = config.PhoneNumber,
            chinaWarehouseId = user.ChinaWarehouseId,
            chinaWarehouseName,
            vietnamWarehouseId = user.VietnamWarehouseId,
            vietnamWarehouseName,
            shippingMethodId = user.ShippingMethodId,
            shippingMethodName,
            salesStaffName,
        });
    }

    /// <summary>Trang "Tài khoản" — khách tự cập nhật hồ sơ của chính mình.</summary>
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateMyProfileRequest request, CancellationToken cancellationToken)
    {
        var validation = await _updateProfileValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));
        }

        var result = await _customerProfileService.UpdateMyProfileAsync(GetCurrentUserId(), request, cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Profile);
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new InvalidOperationException("Missing sub claim.");
        return Guid.Parse(sub);
    }
}
