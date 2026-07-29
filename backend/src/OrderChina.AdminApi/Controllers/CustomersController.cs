using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Users;
using OrderChina.Shared.Application.Users.Dtos;

namespace OrderChina.AdminApi.Controllers;

/// <summary>
/// Danh sách khách hàng cho nhân viên xem. Phase 1 mới chỉ yêu cầu [Authorize] (đã đăng nhập Staff
/// hợp lệ) — chưa gắn policy phân quyền cụ thể (vd "Customer.View") vì UserGroup/PermitObject seed
/// hiện chưa có bộ quyền thật nào được cấp; sẽ siết lại theo permission khi xây bộ phân quyền đầy đủ.
/// </summary>
[ApiController]
[Route("customers")]
[Authorize]
public class CustomersController : ControllerBase
{
    private readonly ICustomerDirectoryService _customerDirectoryService;

    public CustomersController(ICustomerDirectoryService customerDirectoryService)
    {
        _customerDirectoryService = customerDirectoryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCustomers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] int? status = null,
        [FromQuery] int? tier = null,
        [FromQuery] Guid? salesStaffId = null,
        [FromQuery] Guid? orderStaffId = null,
        [FromQuery] Guid? chinaWarehouseId = null,
        [FromQuery] Guid? vietnamWarehouseId = null,
        [FromQuery] Guid? shippingMethodId = null,
        CancellationToken cancellationToken = default)
    {
        var filter = new CustomerListFilter(search, status, tier, salesStaffId, orderStaffId, chinaWarehouseId, vietnamWarehouseId, shippingMethodId);
        var result = await _customerDirectoryService.GetCustomersAsync(page, pageSize, filter, cancellationToken);
        return Ok(result);
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchCustomers([FromQuery] string q, CancellationToken cancellationToken)
    {
        var result = await _customerDirectoryService.SearchCustomersAsync(q ?? string.Empty, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateCustomer(Guid id, [FromBody] UpdateCustomerRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new { error = "Vui lòng nhập họ tên." });
        }

        var result = await _customerDirectoryService.UpdateCustomerAsync(id, request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Customer);
    }

    [HttpPost("{id:guid}/wallet/adjust")]
    public async Task<IActionResult> AdjustWallet(Guid id, [FromBody] WalletAdjustRequest request, CancellationToken cancellationToken)
    {
        var result = await _customerDirectoryService.AdjustWalletAsync(id, request, cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(new { balance = result.NewBalance });
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new InvalidOperationException("Missing sub claim.");
        return Guid.Parse(sub);
    }
}
