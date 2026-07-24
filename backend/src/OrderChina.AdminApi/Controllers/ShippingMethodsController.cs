using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Shipping;

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
}
