using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Wallets;
using OrderChina.Shared.Application.Wallets.Dtos;

namespace OrderChina.AdminApi.Controllers;

[ApiController]
[Route("wallet-recharge")]
[Authorize]
public class WalletRechargeController : ControllerBase
{
    private readonly IWalletRechargeService _walletRechargeService;

    public WalletRechargeController(IWalletRechargeService walletRechargeService)
    {
        _walletRechargeService = walletRechargeService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWalletRechargeRequest request, CancellationToken cancellationToken)
    {
        var result = await _walletRechargeService.CreateAsync(request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { walletBalance = result.NewWalletBalance });
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] Guid userId, CancellationToken cancellationToken)
    {
        var result = await _walletRechargeService.GetHistoryAsync(userId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions(
        [FromQuery] Guid userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await _walletRechargeService.GetTransactionHistoryAsync(userId, page, pageSize, cancellationToken);
        if (result is null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    [HttpGet("list")]
    public async Task<IActionResult> GetList([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var result = await _walletRechargeService.GetRequestListAsync(page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken cancellationToken)
    {
        var result = await _walletRechargeService.ApproveAsync(id, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { walletBalance = result.NewWalletBalance });
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new InvalidOperationException("Missing sub claim.");
        return Guid.Parse(sub);
    }
}
