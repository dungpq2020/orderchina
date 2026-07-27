using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Shipping;
using OrderChina.Shared.Application.Shipping.Dtos;

namespace OrderChina.AdminApi.Controllers;

[ApiController]
[Route("shipping-methods")]
[Authorize]
public class ShippingMethodsController : ControllerBase
{
    private readonly IShippingMethodDirectoryService _shippingMethodDirectoryService;

    public ShippingMethodsController(IShippingMethodDirectoryService shippingMethodDirectoryService)
    {
        _shippingMethodDirectoryService = shippingMethodDirectoryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetShippingMethods(CancellationToken cancellationToken)
    {
        var result = await _shippingMethodDirectoryService.GetShippingMethodsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("admin-list")]
    public async Task<IActionResult> GetAdminList(CancellationToken cancellationToken)
    {
        var result = await _shippingMethodDirectoryService.GetAdminListAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveShippingMethodRequest request, CancellationToken cancellationToken)
    {
        var result = await _shippingMethodDirectoryService.CreateAsync(request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Item);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveShippingMethodRequest request, CancellationToken cancellationToken)
    {
        var result = await _shippingMethodDirectoryService.UpdateAsync(id, request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Item);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _shippingMethodDirectoryService.DeleteAsync(id, GetCurrentUserId(), cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new InvalidOperationException("Missing sub claim.");
        return Guid.Parse(sub);
    }
}
