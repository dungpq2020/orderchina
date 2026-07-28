using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Orders;
using OrderChina.Shared.Application.Orders.Dtos;

namespace OrderChina.AdminApi.Controllers;

[ApiController]
[Route("main-orders")]
[Authorize]
public class MainOrdersController : ControllerBase
{
    private readonly IMainOrderService _mainOrderService;

    public MainOrdersController(IMainOrderService mainOrderService)
    {
        _mainOrderService = mainOrderService;
    }

    [HttpPost("preview")]
    public async Task<IActionResult> Preview([FromBody] PreviewMainOrderRequest request, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.PreviewAsync(request, cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMainOrderRequest request, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.CreateAsync(request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { orderId = result.OrderId, orderCode = result.OrderCode });
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var result = await _mainOrderService.GetListAsync(page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}/staff")]
    public async Task<IActionResult> UpdateStaff(Guid id, [FromBody] UpdateMainOrderStaffRequest request, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.UpdateStaffAsync(id, request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return NoContent();
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.GetByIdAsync(id, cancellationToken);
        if (!result.Succeeded)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Order);
    }

    [HttpPut("{id:guid}/products")]
    public async Task<IActionResult> UpdateProducts(Guid id, [FromBody] UpdateMainOrderProductsRequest request, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.UpdateProductsAsync(id, request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Order);
    }

    [HttpPut("{id:guid}/exchange-rate")]
    public async Task<IActionResult> UpdateExchangeRate(Guid id, [FromBody] UpdateMainOrderExchangeRateRequest request, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.UpdateExchangeRateAsync(id, request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Order);
    }

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateMainOrderStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.UpdateStatusAsync(id, request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Order);
    }

    [HttpPut("{id:guid}/info")]
    public async Task<IActionResult> UpdateInfo(Guid id, [FromBody] UpdateMainOrderInfoRequest request, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.UpdateInfoAsync(id, request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Order);
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new InvalidOperationException("Missing sub claim.");
        return Guid.Parse(sub);
    }
}
