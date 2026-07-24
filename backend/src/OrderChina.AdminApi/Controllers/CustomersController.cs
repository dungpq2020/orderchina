using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Users;

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
    public async Task<IActionResult> GetCustomers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var result = await _customerDirectoryService.GetCustomersAsync(page, pageSize, cancellationToken);
        return Ok(result);
    }
}
