using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Shipping;

namespace OrderChina.CustomerApi.Controllers;

/// <summary>Danh sách phương thức vận chuyển cho dropdown khi khách chốt đơn từ giỏ hàng — chỉ đọc.</summary>
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
}
