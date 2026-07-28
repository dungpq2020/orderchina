using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.CustomerApi.Controllers;

/// <summary>Hồ sơ khách hàng đang đăng nhập — dùng cho navbar dashboard (tên, số dư ví, tỷ giá tham khảo).</summary>
[ApiController]
[Route("me")]
[Authorize]
public class MeController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public MeController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
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

        return Ok(new
        {
            username = user.UserName,
            fullName = user.FullName,
            walletBalance = user.WalletBalance,
            exchangeRate,
            hotline = config.PhoneNumber,
        });
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new InvalidOperationException("Missing sub claim.");
        return Guid.Parse(sub);
    }
}
