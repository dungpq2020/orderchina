using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Orders;

namespace OrderChina.CustomerApi.Controllers;

/// <summary>Trang "Đơn hàng" của customer-web — khách chỉ xem được đơn của chính mình.</summary>
[ApiController]
[Route("orders")]
[Authorize]
public class MainOrdersController : ControllerBase
{
    private readonly IMainOrderService _mainOrderService;

    public MainOrdersController(IMainOrderService mainOrderService)
    {
        _mainOrderService = mainOrderService;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var result = await _mainOrderService.GetCustomerOrdersAsync(GetCurrentUserId(), page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/deposit")]
    public async Task<IActionResult> Deposit(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.DepositAsync(id, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.CancelAsync(id, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
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
