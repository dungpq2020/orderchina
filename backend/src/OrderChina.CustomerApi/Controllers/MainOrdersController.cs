using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Orders;

namespace OrderChina.CustomerApi.Controllers;

/// <summary>Trang "Đơn hàng" của customer-web — khách chỉ xem được đơn của chính mình.</summary>
[ApiController]
[Route("orders")]
[Authorize]
public class MainOrdersController : ControllerBase
{
    private readonly IMainOrderService _mainOrderService;

    public MainOrdersController(IMainOrderService mainOrderService)
    {
        _mainOrderService = mainOrderService;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var result = await _mainOrderService.GetCustomerOrdersAsync(GetCurrentUserId(), page, pageSize, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Trang "Chi tiết đơn hàng" của customer-web — chỉ đọc, khách chỉ xem được đơn của chính mình.
    /// Không trả nguyên <see cref="Dtos.MainOrderDetail"/> (dùng chung với admin) — DTO đó còn chứa dữ liệu
    /// nội bộ (giá mua thực tế, hoa hồng, nhân viên phụ trách, lịch sử thao tác...) không được lộ cho khách.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.GetByIdAsync(id, cancellationToken);
        if (!result.Succeeded || result.Order is null || result.Order.UserId != GetCurrentUserId())
        {
            return NotFound(new { error = "Không tìm thấy đơn hàng." });
        }

        var order = result.Order;
        return Ok(new
        {
            order.Id,
            order.OrderCode,
            order.Username,
            order.CreationType,
            order.Status,
            order.ChinaWarehouseName,
            order.VietnamWarehouseName,
            order.ShippingMethodName,
            Products = order.Products.Select(p => new
            {
                p.Id,
                p.ImageUrl,
                p.ProductLink,
                p.ProductName,
                p.Attributes,
                p.UnitPriceCny,
                p.Quantity,
                p.Note,
            }),
            order.ExchangeRateApplied,
            order.ProductAmountCny,
            order.ProductAmount,
            order.PurchaseFeeAmount,
            order.ShippingFeeCn,
            order.TotalWeightKg,
            order.ShippingFeeVn,
            order.RequestCheckProduct,
            order.CheckProductFeeAmount,
            order.RequestPackaging,
            order.PackagingFeeAmount,
            order.RequestInsurance,
            order.InsuranceFeeAmount,
            order.RequestHomeDelivery,
            order.HomeDeliveryFeeAmount,
            order.TotalAmount,
            order.DepositAmount,
            order.AmountPaid,
            order.RemainingAmount,
            order.Note,
            order.CreatedAtUtc,
            PaymentHistories = order.PaymentHistories.Select(h => new
            {
                h.Id,
                h.Type,
                h.Method,
                h.Amount,
                h.PaidAtUtc,
            }),
            TrackingCodes = order.TrackingCodes.Select(t => new
            {
                t.Id,
                t.Code,
                t.WeightKg,
                t.LengthCm,
                t.WidthCm,
                t.HeightCm,
                t.VolumetricWeightKg,
                t.Status,
                t.Note,
            }),
            order.Timeline,
        });
    }

    [HttpPost("{id:guid}/deposit")]
    public async Task<IActionResult> Deposit(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.DepositAsync(id, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result);
    }

    [HttpPost("{id:guid}/pay")]
    public async Task<IActionResult> Pay(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.PayAsync(id, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken cancellationToken)
    {
        var result = await _mainOrderService.CancelAsync(id, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result);
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new InvalidOperationException("Missing sub claim.");
        return Guid.Parse(sub);
    }
}
