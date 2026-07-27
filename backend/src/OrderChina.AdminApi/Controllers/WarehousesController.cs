using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Warehouses;
using OrderChina.Shared.Application.Warehouses.Dtos;

namespace OrderChina.AdminApi.Controllers;

[ApiController]
[Route("warehouses")]
[Authorize]
public class WarehousesController : ControllerBase
{
    private readonly IWarehouseDirectoryService _warehouseDirectoryService;

    public WarehousesController(IWarehouseDirectoryService warehouseDirectoryService)
    {
        _warehouseDirectoryService = warehouseDirectoryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetWarehouses([FromQuery] string? type, CancellationToken cancellationToken)
    {
        var result = await _warehouseDirectoryService.GetWarehousesAsync(type, cancellationToken);
        return Ok(result);
    }

    [HttpGet("admin-list")]
    public async Task<IActionResult> GetAdminList([FromQuery] string? type, CancellationToken cancellationToken)
    {
        var result = await _warehouseDirectoryService.GetAdminListAsync(type, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveWarehouseRequest request, CancellationToken cancellationToken)
    {
        var result = await _warehouseDirectoryService.CreateAsync(request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Item);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveWarehouseRequest request, CancellationToken cancellationToken)
    {
        var result = await _warehouseDirectoryService.UpdateAsync(id, request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Item);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _warehouseDirectoryService.DeleteAsync(id, GetCurrentUserId(), cancellationToken);
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
