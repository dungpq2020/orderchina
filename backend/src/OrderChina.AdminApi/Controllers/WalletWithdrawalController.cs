using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Wallets;
using OrderChina.Shared.Application.Wallets.Dtos;

namespace OrderChina.AdminApi.Controllers;

[ApiController]
[Route("wallet-withdrawal")]
[Authorize]
public class WalletWithdrawalController : ControllerBase
{
    private readonly IWalletWithdrawalService _walletWithdrawalService;

    public WalletWithdrawalController(IWalletWithdrawalService walletWithdrawalService)
    {
        _walletWithdrawalService = walletWithdrawalService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWalletWithdrawalRequest request, CancellationToken cancellationToken)
    {
        var result = await _walletWithdrawalService.CreateAsync(request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { walletBalance = result.NewWalletBalance });
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory([FromQuery] Guid userId, CancellationToken cancellationToken)
    {
        var result = await _walletWithdrawalService.GetHistoryAsync(userId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("list")]
    public async Task<IActionResult> GetList([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var result = await _walletWithdrawalService.GetRequestListAsync(page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken cancellationToken)
    {
        var result = await _walletWithdrawalService.ApproveAsync(id, GetCurrentUserId(), cancellationToken);
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
