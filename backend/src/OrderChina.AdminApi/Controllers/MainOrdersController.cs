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

    private IActionResult ToActionResult(UpdateMainOrderResult result)
    {
        if (result.Succeeded)
        {
            return Ok(result.Order);
        }

        if (result.IsConflict)
        {
            return Conflict(new { error = result.Error });
        }

        return BadRequest(new { error = result.Error });
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
        return ToActionResult(result);
    }

    [HttpPut("{id:guid}/exchange-rate")]
    public async Task<IActionResult> UpdateExchangeRate(Guid id, [FromBody] UpdateMainOrderExchangeRateRequest request, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.UpdateExchangeRateAsync(id, request, GetCurrentUserId(), cancellationToken);
        return ToActionResult(result);
    }

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateMainOrderStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.UpdateStatusAsync(id, request, GetCurrentUserId(), cancellationToken);
        return ToActionResult(result);
    }

    [HttpPut("{id:guid}/info")]
    public async Task<IActionResult> UpdateInfo(Guid id, [FromBody] UpdateMainOrderInfoRequest request, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.UpdateInfoAsync(id, request, GetCurrentUserId(), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Staff đặt cọc hộ khách (khách trả tiền ngoài hệ thống) — trả về nguyên đơn hàng đầy đủ giống các API cập nhật khác, để FE refresh 1 lần.</summary>
    [HttpPost("{id:guid}/deposit")]
    public async Task<IActionResult> Deposit(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.AdminDepositAsync(id, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        var detail = await _mainOrderService.GetByIdAsync(id, cancellationToken);
        return Ok(detail.Order);
    }

    /// <summary>Staff thanh toán hộ khách — cùng lý do với Deposit ở trên.</summary>
    [HttpPost("{id:guid}/pay")]
    public async Task<IActionResult> Pay(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.AdminPayAsync(id, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        var detail = await _mainOrderService.GetByIdAsync(id, cancellationToken);
        return Ok(detail.Order);
    }

    [HttpPut("{id:guid}/shop-codes")]
    public async Task<IActionResult> UpdateShopCodes(Guid id, [FromBody] UpdateMainOrderShopCodesRequest request, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.UpdateShopCodesAsync(id, request, GetCurrentUserId(), cancellationToken);
        return ToActionResult(result);
    }

    [HttpPut("{id:guid}/tracking-codes")]
    public async Task<IActionResult> UpdateTrackingCodes(Guid id, [FromBody] UpdateMainOrderTrackingCodesRequest request, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.UpdateTrackingCodesAsync(id, request, GetCurrentUserId(), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Trang "Kiểm hàng kho Trung Quốc" — quét mã vận đơn, hệ thống tự tra ra đơn tương ứng.</summary>
    [HttpPost("tracking-codes/check-in-china-warehouse")]
    public async Task<IActionResult> CheckInTrackingCodeChinaWarehouse([FromBody] CheckInTrackingCodeChinaWarehouseRequest request, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.CheckInTrackingCodeChinaWarehouseAsync(request, GetCurrentUserId(), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Trang "Xuất kho Trung Quốc" — quét mã vận đơn đã kiểm hàng để xác nhận rời kho TQ.</summary>
    [HttpPost("tracking-codes/export-china-warehouse")]
    public async Task<IActionResult> ExportTrackingCodeChinaWarehouse([FromBody] ExportTrackingCodeChinaWarehouseRequest request, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.ExportTrackingCodeChinaWarehouseAsync(request, GetCurrentUserId(), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Trang "Kiểm kho Việt Nam" — quét mã vận đơn đã xuất kho TQ để xác nhận về tới kho VN.</summary>
    [HttpPost("tracking-codes/check-in-vietnam-warehouse")]
    public async Task<IActionResult> CheckInTrackingCodeVietnamWarehouse([FromBody] CheckInTrackingCodeVietnamWarehouseRequest request, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.CheckInTrackingCodeVietnamWarehouseAsync(request, GetCurrentUserId(), cancellationToken);
        return ToActionResult(result);
    }

    /// <summary>Trang "Quản lý kiện hàng" — danh sách mã vận đơn của mọi đơn, lọc theo trạng thái + tìm kiếm.</summary>
    [HttpGet("tracking-codes")]
    public async Task<IActionResult> GetTrackingCodeList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? status = null,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        var result = await _mainOrderService.GetTrackingCodeListAsync(page, pageSize, status, search, cancellationToken);
        return Ok(result);
    }

    /// <summary>Tra cứu thuần theo mã vận đơn ngay sau khi quét — hiển thị ngữ cảnh đơn hàng trước khi Cập nhật.</summary>
    [HttpGet("tracking-codes/{code}")]
    public async Task<IActionResult> LookupTrackingCodeChinaWarehouse(string code, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.LookupTrackingCodeForChinaWarehouseAsync(code, cancellationToken);
        if (!result.Succeeded)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Data);
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new InvalidOperationException("Missing sub claim.");
        return Guid.Parse(sub);
    }
}
