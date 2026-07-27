using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Orders;
using OrderChina.Shared.Application.Orders.Dtos;
using OrderChina.Shared.Domain.Fees;
using OrderChina.Shared.Domain.Identity;
using OrderChina.Shared.Domain.Orders;
using OrderChina.Shared.Domain.Warehouses;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.Shared.Infrastructure.Orders;

public class MainOrderService : IMainOrderService
{
    private static readonly TimeZoneInfo VnTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");

    private readonly AppDbContext _dbContext;

    public MainOrderService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PreviewMainOrderResult> PreviewAsync(PreviewMainOrderRequest request, CancellationToken cancellationToken = default)
    {
        var validationError = ValidateProducts(request.Products);
        if (validationError is not null)
        {
            return new PreviewMainOrderResult(false, validationError, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        }

        var customer = await _dbContext.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.CustomerId && u.UserType == UserType.Customer, cancellationToken);
        if (customer is null)
        {
            return new PreviewMainOrderResult(false, "Không tìm thấy khách hàng.", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        }

        var pricing = await CalculatePricingAsync(customer, request.Products, request.Services, cancellationToken);

        return new PreviewMainOrderResult(
            true,
            null,
            pricing.ExchangeRateApplied,
            pricing.ProductAmount,
            pricing.PurchaseFeePercentApplied,
            pricing.PurchaseFeeAmount,
            pricing.ShippingFeeCn,
            pricing.ShippingFeeVn,
            pricing.InsuranceFeeAmount,
            pricing.CheckProductFeeAmount,
            pricing.TotalAmount,
            pricing.MinDepositPercentApplied,
            pricing.DepositAmount);
    }

    public async Task<CreateMainOrderResult> CreateAsync(CreateMainOrderRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var validationError = ValidateProducts(request.Products);
        if (validationError is not null)
        {
            return new CreateMainOrderResult(false, validationError, null, null);
        }

        var customer = await _dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == request.CustomerId && u.UserType == UserType.Customer, cancellationToken);
        if (customer is null)
        {
            return new CreateMainOrderResult(false, "Không tìm thấy khách hàng.", null, null);
        }

        var chinaWarehouseValid = await _dbContext.Warehouses.AnyAsync(
            w => w.Id == request.ChinaWarehouseId && w.Type == WarehouseType.China && w.IsActive && !w.IsDeleted, cancellationToken);
        if (!chinaWarehouseValid)
        {
            return new CreateMainOrderResult(false, "Kho Trung Quốc không hợp lệ.", null, null);
        }

        var vietnamWarehouseValid = await _dbContext.Warehouses.AnyAsync(
            w => w.Id == request.VietnamWarehouseId && w.Type == WarehouseType.Vietnam && w.IsActive && !w.IsDeleted, cancellationToken);
        if (!vietnamWarehouseValid)
        {
            return new CreateMainOrderResult(false, "Kho Việt Nam không hợp lệ.", null, null);
        }

        var shippingMethodValid = await _dbContext.ShippingMethods.AnyAsync(
            s => s.Id == request.ShippingMethodId && s.IsActive && !s.IsDeleted, cancellationToken);
        if (!shippingMethodValid)
        {
            return new CreateMainOrderResult(false, "Phương thức vận chuyển không hợp lệ.", null, null);
        }

        var pricing = await CalculatePricingAsync(customer, request.Products, request.Services, cancellationToken);

        var order = new MainOrder
        {
            Id = Guid.NewGuid(),
            UserId = customer.Id,
            OrderType = FeeOrderType.PurchaseOnBehalf,
            // Trang này chỉ dành cho staff tạo hộ khách — luôn là Manual, khởi tạo ở trạng thái Chờ báo giá.
            CreationType = MainOrderCreationType.Manual,
            ChinaWarehouseId = request.ChinaWarehouseId,
            VietnamWarehouseId = request.VietnamWarehouseId,
            ShippingMethodId = request.ShippingMethodId,
            // Mặc định lấy nhân viên phụ trách theo hồ sơ khách — staff có thể đổi lại sau ở trang danh sách.
            OrderStaffId = customer.OrderStaffId,
            SalesStaffId = customer.SalesStaffId,
            ExchangeRateApplied = pricing.ExchangeRateApplied,
            ProductAmount = pricing.ProductAmount,
            PurchaseFeePercentApplied = pricing.PurchaseFeePercentApplied,
            PurchaseFeeAmount = pricing.PurchaseFeeAmount,
            ShippingFeeCn = pricing.ShippingFeeCn,
            ShippingFeeVn = pricing.ShippingFeeVn,
            RequestPackaging = request.Services.RequestPackaging,
            RequestInsurance = request.Services.RequestInsurance,
            InsuranceFeeAmount = pricing.InsuranceFeeAmount,
            RequestCheckProduct = request.Services.RequestCheckProduct,
            CheckProductFeeAmount = pricing.CheckProductFeeAmount,
            RequestHomeDelivery = request.Services.RequestHomeDelivery,
            TotalAmount = pricing.TotalAmount,
            MinDepositPercentApplied = pricing.MinDepositPercentApplied,
            DepositAmount = pricing.DepositAmount,
            Status = MainOrderStatus.AwaitingQuote,
            Note = request.Note,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedByUserId = actingUserId,
        };
        order.Products = request.Products.Select(p => new MainOrderProduct
        {
            Id = Guid.NewGuid(),
            MainOrderId = order.Id,
            ImageUrl = p.ImageUrl,
            ProductLink = p.ProductLink,
            ProductName = p.ProductName,
            Attributes = p.Attributes,
            UnitPriceCny = p.UnitPriceCny,
            Quantity = p.Quantity,
            Note = p.Note,
            CreatedAtUtc = DateTime.UtcNow,
        }).ToList();

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        // Số thứ tự trong mã đơn reset về 1 mỗi ngày mới (giờ VN) — khác với OrderNumber (identity Postgres,
        // tăng dần vĩnh viễn, dùng làm ID nội bộ hiển thị ở cột "ID" trên danh sách đơn hàng).
        var vnCreatedDate = TimeZoneInfo.ConvertTimeFromUtc(order.CreatedAtUtc, VnTimeZone);
        var vnDayStartUtc = TimeZoneInfo.ConvertTimeToUtc(vnCreatedDate.Date, VnTimeZone);
        var vnDayEndUtc = vnDayStartUtc.AddDays(1);
        var ordersTodayCount = await _dbContext.MainOrders
            .Where(o => o.CreatedAtUtc >= vnDayStartUtc && o.CreatedAtUtc < vnDayEndUtc)
            .CountAsync(cancellationToken);
        order.OrderCode = $"MH{vnCreatedDate:yyyyMMdd}-{ordersTodayCount + 1}";

        _dbContext.MainOrders.Add(order);
        await _dbContext.SaveChangesAsync(cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return new CreateMainOrderResult(true, null, order.Id, order.OrderCode);
    }

    public async Task<MainOrderListResult> GetListAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 20 : pageSize;

        var query = _dbContext.MainOrders.AsNoTracking();

        var totalCount = await query.CountAsync(cancellationToken);

        var rows = await query
            .OrderByDescending(o => o.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new
            {
                o.Id,
                o.OrderNumber,
                o.OrderCode,
                o.UserId,
                OrderType = (int)o.OrderType,
                CreationType = (int)o.CreationType,
                o.VietnamWarehouseId,
                o.OrderStaffId,
                o.SalesStaffId,
                o.ExchangeRateApplied,
                ProductAmountCny = o.Products.Sum(p => p.UnitPriceCny * p.Quantity),
                FirstProductImageUrl = o.Products.OrderBy(p => p.CreatedAtUtc).Select(p => p.ImageUrl).FirstOrDefault(),
                FirstProductLink = o.Products.OrderBy(p => p.CreatedAtUtc).Select(p => p.ProductLink).FirstOrDefault(),
                o.ProductAmount,
                o.PurchaseFeeAmount,
                o.ShippingFeeCn,
                o.ShippingFeeVn,
                o.InsuranceFeeAmount,
                o.CheckProductFeeAmount,
                o.TotalAmount,
                o.DepositAmount,
                Status = (int)o.Status,
                ProductCount = o.Products.Count,
                o.CreatedAtUtc,
                o.CreatedByUserId,
                o.AwaitingDepositAtUtc,
                o.DepositedAtUtc,
                o.PurchasedAtUtc,
                o.AwaitingShopShipmentAtUtc,
                o.ShopShippedAtUtc,
                o.ArrivedChinaWarehouseAtUtc,
                o.InTransitToVietnamAtUtc,
                o.ArrivedVietnamWarehouseAtUtc,
                o.PaidAtUtc,
                o.CompletedAtUtc,
                o.ComplaintAtUtc,
                o.CancelledAtUtc,
            })
            .ToListAsync(cancellationToken);

        var userIds = rows.Select(o => o.UserId)
            .Concat(rows.Select(o => o.CreatedByUserId))
            .Concat(rows.Where(o => o.OrderStaffId.HasValue).Select(o => o.OrderStaffId!.Value))
            .Concat(rows.Where(o => o.SalesStaffId.HasValue).Select(o => o.SalesStaffId!.Value))
            .Distinct()
            .ToList();
        var usernames = await _dbContext.Users
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName!, cancellationToken);

        var warehouseIds = rows.Where(o => o.VietnamWarehouseId.HasValue).Select(o => o.VietnamWarehouseId!.Value).Distinct().ToList();
        var warehouseNames = await _dbContext.Warehouses
            .AsNoTracking()
            .Where(w => warehouseIds.Contains(w.Id))
            .ToDictionaryAsync(w => w.Id, w => w.Name, cancellationToken);

        // Chưa xây cơ chế ghi nhận thanh toán cho đơn — tạm coi như chưa trả gì, còn lại = tổng tiền.
        const decimal amountPaid = 0;

        var items = rows.Select(o => new MainOrderListItem(
            o.Id,
            o.OrderNumber,
            o.OrderCode,
            o.UserId,
            usernames.GetValueOrDefault(o.UserId, "—"),
            o.OrderType,
            o.CreationType,
            o.FirstProductImageUrl,
            o.FirstProductLink,
            o.ProductAmountCny,
            o.ExchangeRateApplied,
            o.ProductAmount,
            o.PurchaseFeeAmount,
            o.ShippingFeeCn,
            o.ShippingFeeVn,
            o.InsuranceFeeAmount,
            o.CheckProductFeeAmount,
            o.TotalAmount,
            o.DepositAmount,
            amountPaid,
            o.TotalAmount - amountPaid,
            o.VietnamWarehouseId is { } vnWarehouseId ? warehouseNames.GetValueOrDefault(vnWarehouseId) : null,
            o.OrderStaffId,
            o.OrderStaffId is { } orderStaffId ? usernames.GetValueOrDefault(orderStaffId) : null,
            o.SalesStaffId,
            o.SalesStaffId is { } salesStaffId ? usernames.GetValueOrDefault(salesStaffId) : null,
            o.Status,
            o.ProductCount,
            o.CreatedAtUtc,
            usernames.GetValueOrDefault(o.CreatedByUserId),
            BuildTimeline(
                (MainOrderCreationType)o.CreationType,
                (MainOrderStatus)o.Status,
                o.CreatedAtUtc,
                o.AwaitingDepositAtUtc,
                o.DepositedAtUtc,
                o.PurchasedAtUtc,
                o.AwaitingShopShipmentAtUtc,
                o.ShopShippedAtUtc,
                o.ArrivedChinaWarehouseAtUtc,
                o.InTransitToVietnamAtUtc,
                o.ArrivedVietnamWarehouseAtUtc,
                o.PaidAtUtc,
                o.CompletedAtUtc,
                o.ComplaintAtUtc,
                o.CancelledAtUtc)))
            .ToList();

        return new MainOrderListResult(items, totalCount, page, pageSize);
    }

    /// <summary>
    /// Dựng TimeLine hiển thị — chỉ liệt kê các trạng thái đơn ĐÃ ĐI QUA (tới trạng thái hiện tại), mỗi
    /// trạng thái kèm mốc thời gian riêng của nó. AwaitingQuote luôn dùng CreatedAtUtc (khởi tạo đơn Manual);
    /// AwaitingDeposit dùng CreatedAtUtc nếu là đơn Extension (khởi tạo thẳng ở đây) hoặc AwaitingDepositAtUtc
    /// nếu là đơn Manual (chuyển từ AwaitingQuote sau khi báo giá).
    /// </summary>
    private static IReadOnlyList<MainOrderTimelineEntry> BuildTimeline(
        MainOrderCreationType creationType,
        MainOrderStatus currentStatus,
        DateTime createdAtUtc,
        DateTime? awaitingDepositAtUtc,
        DateTime? depositedAtUtc,
        DateTime? purchasedAtUtc,
        DateTime? awaitingShopShipmentAtUtc,
        DateTime? shopShippedAtUtc,
        DateTime? arrivedChinaWarehouseAtUtc,
        DateTime? inTransitToVietnamAtUtc,
        DateTime? arrivedVietnamWarehouseAtUtc,
        DateTime? paidAtUtc,
        DateTime? completedAtUtc,
        DateTime? complaintAtUtc,
        DateTime? cancelledAtUtc)
    {
        var entries = new List<MainOrderTimelineEntry>();

        if (creationType == MainOrderCreationType.Manual)
        {
            entries.Add(new MainOrderTimelineEntry((int)MainOrderStatus.AwaitingQuote, createdAtUtc));
        }

        var awaitingDepositAt = creationType == MainOrderCreationType.Extension ? createdAtUtc : awaitingDepositAtUtc;
        AddIfReached(entries, MainOrderStatus.AwaitingDeposit, awaitingDepositAt, currentStatus);
        AddIfReached(entries, MainOrderStatus.Deposited, depositedAtUtc, currentStatus);
        AddIfReached(entries, MainOrderStatus.Purchased, purchasedAtUtc, currentStatus);
        AddIfReached(entries, MainOrderStatus.AwaitingShopShipment, awaitingShopShipmentAtUtc, currentStatus);
        AddIfReached(entries, MainOrderStatus.ShopShipped, shopShippedAtUtc, currentStatus);
        AddIfReached(entries, MainOrderStatus.ArrivedChinaWarehouse, arrivedChinaWarehouseAtUtc, currentStatus);
        AddIfReached(entries, MainOrderStatus.InTransitToVietnam, inTransitToVietnamAtUtc, currentStatus);
        AddIfReached(entries, MainOrderStatus.ArrivedVietnamWarehouse, arrivedVietnamWarehouseAtUtc, currentStatus);
        AddIfReached(entries, MainOrderStatus.Paid, paidAtUtc, currentStatus);
        AddIfReached(entries, MainOrderStatus.Completed, completedAtUtc, currentStatus);
        // Complaint/Cancelled có thể xảy ra xen giữa bất kỳ lúc nào — hiển thị nếu có mốc thời gian, không phụ thuộc thứ tự.
        if (complaintAtUtc is { } complaintAt)
        {
            entries.Add(new MainOrderTimelineEntry((int)MainOrderStatus.Complaint, complaintAt));
        }
        if (cancelledAtUtc is { } cancelledAt)
        {
            entries.Add(new MainOrderTimelineEntry((int)MainOrderStatus.Cancelled, cancelledAt));
        }

        return entries;
    }

    private static void AddIfReached(List<MainOrderTimelineEntry> entries, MainOrderStatus status, DateTime? atUtc, MainOrderStatus currentStatus)
    {
        if (atUtc is { } at && (int)status <= (int)currentStatus)
        {
            entries.Add(new MainOrderTimelineEntry((int)status, at));
        }
    }

    public async Task<UpdateMainOrderStaffResult> UpdateStaffAsync(Guid orderId, UpdateMainOrderStaffRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var order = await _dbContext.MainOrders.FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order is null)
        {
            return new UpdateMainOrderStaffResult(false, "Không tìm thấy đơn hàng.");
        }

        if (request.OrderStaffId is { } orderStaffId
            && !await _dbContext.Users.AnyAsync(u => u.Id == orderStaffId && u.UserType == UserType.Staff, cancellationToken))
        {
            return new UpdateMainOrderStaffResult(false, "Nhân viên đặt hàng không hợp lệ.");
        }

        if (request.SalesStaffId is { } salesStaffId
            && !await _dbContext.Users.AnyAsync(u => u.Id == salesStaffId && u.UserType == UserType.Staff, cancellationToken))
        {
            return new UpdateMainOrderStaffResult(false, "Nhân viên kinh doanh không hợp lệ.");
        }

        order.OrderStaffId = request.OrderStaffId;
        order.SalesStaffId = request.SalesStaffId;
        order.UpdatedAtUtc = DateTime.UtcNow;
        order.UpdatedByUserId = actingUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new UpdateMainOrderStaffResult(true, null);
    }

    private static string? ValidateProducts(IReadOnlyList<MainOrderProductInput> products)
    {
        if (products.Count == 0)
        {
            return "Vui lòng thêm ít nhất 1 sản phẩm.";
        }

        foreach (var p in products)
        {
            if (string.IsNullOrWhiteSpace(p.ProductName))
            {
                return "Vui lòng nhập tên sản phẩm.";
            }

            if (p.UnitPriceCny <= 0)
            {
                return $"Giá sản phẩm \"{p.ProductName}\" phải lớn hơn 0.";
            }

            if (p.Quantity <= 0)
            {
                return $"Số lượng sản phẩm \"{p.ProductName}\" phải lớn hơn 0.";
            }
        }

        return null;
    }

    private async Task<PricingBreakdown> CalculatePricingAsync(
        ApplicationUser customer,
        IReadOnlyList<MainOrderProductInput> products,
        MainOrderServiceOptions services,
        CancellationToken cancellationToken)
    {
        var config = await _dbContext.SystemConfigs.AsNoTracking().FirstAsync(cancellationToken);

        var totalCny = products.Sum(p => p.UnitPriceCny * p.Quantity);

        var exchangeRate = customer.CustomExchangeRate is > 0
            ? customer.CustomExchangeRate.Value
            : config.PurchaseExchangeRate;

        var productAmount = totalCny * exchangeRate;

        decimal feePercent;
        if (customer.CustomPurchaseFeePercent is > 0)
        {
            feePercent = customer.CustomPurchaseFeePercent.Value;
        }
        else
        {
            var tier = await _dbContext.FeeBuyPros
                .AsNoTracking()
                .Where(t => t.IsActive && !t.IsDeleted && productAmount >= t.PriceFrom && productAmount < t.PriceTo)
                .FirstOrDefaultAsync(cancellationToken);
            feePercent = tier?.Percent ?? 0;
        }

        var purchaseFeeAmount = productAmount * feePercent / 100m;

        var userLevel = await _dbContext.UserLevels
            .AsNoTracking()
            .Where(l => l.IsActive && !l.IsDeleted && l.Rank == customer.Tier)
            .FirstOrDefaultAsync(cancellationToken);
        if (userLevel is not null && userLevel.PurchaseFeeDiscountPercent > 0)
        {
            purchaseFeeAmount *= 1 - userLevel.PurchaseFeeDiscountPercent / 100m;
        }

        if (config.MinPurchaseFee > 0 && purchaseFeeAmount < config.MinPurchaseFee)
        {
            purchaseFeeAmount = config.MinPurchaseFee;
        }

        const decimal shippingFeeCn = 0; // Nhập tay sau, chưa xác định lúc tạo đơn.
        const decimal shippingFeeVn = 0; // Chỉ tính được khi đơn đã gắn mã vận đơn.

        var insuranceFeeAmount = services.RequestInsurance
            ? productAmount * config.PurchaseInsurancePercent / 100m
            : 0;

        var checkProductFeeAmount = services.RequestCheckProduct
            ? await CalculateCheckProductFeeAsync(products, cancellationToken)
            : 0;

        var totalAmount = productAmount + purchaseFeeAmount + shippingFeeCn + shippingFeeVn + insuranceFeeAmount + checkProductFeeAmount;

        var depositPercent = customer.CustomMinDepositPercent is > 0
            ? customer.CustomMinDepositPercent.Value
            : userLevel?.MinDepositPercent ?? 0;
        var depositAmount = totalAmount * depositPercent / 100m;

        return new PricingBreakdown(
            exchangeRate,
            productAmount,
            feePercent,
            purchaseFeeAmount,
            shippingFeeCn,
            shippingFeeVn,
            insuranceFeeAmount,
            checkProductFeeAmount,
            totalAmount,
            depositPercent,
            depositAmount);
    }

    /// <summary>
    /// Phí kiểm hàng: mỗi dòng sản phẩm tra bậc FeeCheckProduct theo giá ¥ (dưới/trên 10 tệ) và số lượng của
    /// CHÍNH dòng đó, đơn giá bậc đó nhân với số lượng — càng nhiều số lượng, đơn giá kiểm càng rẻ.
    /// </summary>
    private async Task<decimal> CalculateCheckProductFeeAsync(IReadOnlyList<MainOrderProductInput> products, CancellationToken cancellationToken)
    {
        var tiers = await _dbContext.FeeCheckProducts
            .AsNoTracking()
            .Where(t => t.IsActive && !t.IsDeleted)
            .ToListAsync(cancellationToken);

        decimal total = 0;
        foreach (var p in products)
        {
            var priceTier = p.UnitPriceCny < 10 ? FeeCheckProductPriceTier.LessThan10Yuan : FeeCheckProductPriceTier.GreaterThan10Yuan;
            var tier = tiers.FirstOrDefault(t => t.PriceTier == priceTier && p.Quantity >= t.QuantityFrom && p.Quantity <= t.QuantityTo);
            if (tier is not null)
            {
                total += tier.Price * p.Quantity;
            }
        }

        return total;
    }

    private readonly record struct PricingBreakdown(
        decimal ExchangeRateApplied,
        decimal ProductAmount,
        decimal PurchaseFeePercentApplied,
        decimal PurchaseFeeAmount,
        decimal ShippingFeeCn,
        decimal ShippingFeeVn,
        decimal InsuranceFeeAmount,
        decimal CheckProductFeeAmount,
        decimal TotalAmount,
        decimal MinDepositPercentApplied,
        decimal DepositAmount);
}
