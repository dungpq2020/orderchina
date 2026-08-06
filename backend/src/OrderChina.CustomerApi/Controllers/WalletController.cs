using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Wallets;

namespace OrderChina.CustomerApi.Controllers;

/// <summary>Trang "Lịch sử giao dịch" của customer-web — khách chỉ xem được giao dịch ví của chính mình.</summary>
[ApiController]
[Route("wallet")]
[Authorize]
public class WalletController : ControllerBase
{
    private readonly IWalletRechargeService _walletRechargeService;

    public WalletController(IWalletRechargeService walletRechargeService)
    {
        _walletRechargeService = walletRechargeService;
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var result = await _walletRechargeService.GetTransactionHistoryAsync(GetCurrentUserId(), page, pageSize, cancellationToken);
        if (result is null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new InvalidOperationException("Missing sub claim.");
        return Guid.Parse(sub);
    }
}
