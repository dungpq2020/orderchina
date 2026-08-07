using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Carts;
using OrderChina.Shared.Application.Carts.Dtos;

namespace OrderChina.CustomerApi.Controllers;

/// <summary>Giỏ hàng của khách — extension (trang chi tiết Taobao/1688) gọi POST /cart/items để thêm sản
/// phẩm, trang "Giỏ hàng" gọi các API còn lại để xem/sửa/chốt đơn.</summary>
[ApiController]
[Route("cart")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;

    public CartController(ICartService cartService)
    {
        _cartService = cartService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCart(CancellationToken cancellationToken)
    {
        var result = await _cartService.GetCartAsync(GetCurrentUserId(), cancellationToken);
        return Ok(result);
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddItem([FromBody] AddToCartRequest request, CancellationToken cancellationToken)
    {
        var result = await _cartService.AddItemAsync(GetCurrentUserId(), request, cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result);
    }

    [HttpPut("items/{id:guid}")]
    public async Task<IActionResult> UpdateItem(Guid id, [FromBody] UpdateCartItemRequest request, CancellationToken cancellationToken)
    {
        var succeeded = await _cartService.UpdateItemAsync(GetCurrentUserId(), id, request, cancellationToken);
        if (!succeeded)
        {
            return NotFound(new { error = "Không tìm thấy sản phẩm trong giỏ." });
        }

        return NoContent();
    }

    [HttpDelete("items/{id:guid}")]
    public async Task<IActionResult> RemoveItem(Guid id, CancellationToken cancellationToken)
    {
        var succeeded = await _cartService.RemoveItemAsync(GetCurrentUserId(), id, cancellationToken);
        if (!succeeded)
        {
            return NotFound(new { error = "Không tìm thấy sản phẩm trong giỏ." });
        }

        return NoContent();
    }

    [HttpPut("shops/{id:guid}/services")]
    public async Task<IActionResult> UpdateShopServices(Guid id, [FromBody] UpdateCartShopServicesRequest request, CancellationToken cancellationToken)
    {
        var succeeded = await _cartService.UpdateShopServicesAsync(GetCurrentUserId(), id, request, cancellationToken);
        if (!succeeded)
        {
            return NotFound(new { error = "Không tìm thấy shop trong giỏ." });
        }

        return NoContent();
    }

    [HttpDelete("shops/{id:guid}")]
    public async Task<IActionResult> RemoveShop(Guid id, CancellationToken cancellationToken)
    {
        var succeeded = await _cartService.RemoveShopAsync(GetCurrentUserId(), id, cancellationToken);
        if (!succeeded)
        {
            return NotFound(new { error = "Không tìm thấy shop trong giỏ." });
        }

        return NoContent();
    }

    [HttpPost("shops/{id:guid}/checkout")]
    public async Task<IActionResult> Checkout(Guid id, [FromBody] CheckoutCartRequest request, CancellationToken cancellationToken)
    {
        var result = await _cartService.CheckoutAsync(GetCurrentUserId(), id, request, cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { orderId = result.OrderId, orderCode = result.OrderCode });
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new InvalidOperationException("Missing sub claim.");
        return Guid.Parse(sub);
    }
}
