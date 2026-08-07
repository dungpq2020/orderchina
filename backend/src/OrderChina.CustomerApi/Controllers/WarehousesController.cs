using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Warehouses;

namespace OrderChina.CustomerApi.Controllers;

/// <summary>Danh sách kho (Trung Quốc/Việt Nam) cho dropdown khi khách chốt đơn từ giỏ hàng — chỉ đọc.</summary>
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
}
