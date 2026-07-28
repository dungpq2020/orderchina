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
            ProductAmountCny = request.Products.Sum(p => p.UnitPriceCny * p.Quantity),
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
                o.ProductAmountCny,
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
                o.AmountPaid,
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
            o.AmountPaid,
            o.TotalAmount - o.AmountPaid,
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

    public async Task<GetMainOrderResult> GetByIdAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        var order = await _dbContext.MainOrders
            .AsNoTracking()
            .Include(o => o.Products)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order is null)
        {
            return new GetMainOrderResult(false, "Không tìm thấy đơn hàng.", null);
        }

        return new GetMainOrderResult(true, null, await BuildDetailAsync(order, cancellationToken));
    }

    public async Task<UpdateMainOrderResult> UpdateProductsAsync(Guid orderId, UpdateMainOrderProductsRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        var validationError = ValidateProducts(request.Products, allowZeroQuantity: true);
        if (validationError is not null)
        {
            return new UpdateMainOrderResult(false, validationError, null);
        }

        var order = await _dbContext.MainOrders
            .Include(o => o.Products)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order is null)
        {
            return new UpdateMainOrderResult(false, "Không tìm thấy đơn hàng.", null);
        }

        // Thay toàn bộ dòng sản phẩm — đơn giản hơn diff từng dòng, phù hợp vì bảng sản phẩm luôn
        // sửa cả loạt trên UI (thêm/xoá/sửa) rồi bấm Lưu 1 lần, không sửa từng ô rời rạc.
        //
        // Xoá/thêm thẳng qua DbSet (RemoveRange/AddRange), KHÔNG qua order.Products.Add(...) trên
        // navigation collection — đã xác nhận bằng debug rằng entity mới add qua navigation collection
        // bị EF gán nhầm EntityState.Modified thay vì Added (dù Id là Guid.NewGuid() hoàn toàn mới),
        // khiến EF sinh UPDATE cho 1 dòng chưa từng tồn tại → 0 dòng bị ảnh hưởng → ném
        // DbUpdateConcurrencyException dù không có xung đột dữ liệu thật sự. Add thẳng qua DbSet ép
        // đúng EntityState.Added, không đi qua cơ chế tự suy luận bị lỗi đó.
        _dbContext.MainOrderProducts.RemoveRange(order.Products);

        var newProducts = request.Products.Select(p => new MainOrderProduct
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
        _dbContext.MainOrderProducts.AddRange(newProducts);
        order.Products = newProducts;

        await RecalculateTotalsAsync(order, cancellationToken);
        order.UpdatedAtUtc = DateTime.UtcNow;
        order.UpdatedByUserId = actingUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new UpdateMainOrderResult(true, null, await BuildDetailAsync(order, cancellationToken));
    }

    /// <summary>Tách riêng khỏi UpdateInfoAsync — tỷ giá có nút "Sửa tỷ giá" và API cập nhật riêng, không đi chung với lưu Phí cố định/Phí tùy chọn.</summary>
    public async Task<UpdateMainOrderResult> UpdateExchangeRateAsync(Guid orderId, UpdateMainOrderExchangeRateRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        if (request.ExchangeRateApplied <= 0)
        {
            return new UpdateMainOrderResult(false, "Tỷ giá phải lớn hơn 0.", null);
        }

        var order = await _dbContext.MainOrders
            .Include(o => o.Products)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order is null)
        {
            return new UpdateMainOrderResult(false, "Không tìm thấy đơn hàng.", null);
        }

        order.ExchangeRateApplied = request.ExchangeRateApplied;

        await RecalculateTotalsAsync(order, cancellationToken);
        order.UpdatedAtUtc = DateTime.UtcNow;
        order.UpdatedByUserId = actingUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new UpdateMainOrderResult(true, null, await BuildDetailAsync(order, cancellationToken));
    }

    public async Task<UpdateMainOrderResult> UpdateStatusAsync(Guid orderId, UpdateMainOrderStatusRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        if (!Enum.IsDefined(typeof(MainOrderStatus), request.Status))
        {
            return new UpdateMainOrderResult(false, "Trạng thái không hợp lệ.", null);
        }

        var order = await _dbContext.MainOrders
            .Include(o => o.Products)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order is null)
        {
            return new UpdateMainOrderResult(false, "Không tìm thấy đơn hàng.", null);
        }

        var newStatus = (MainOrderStatus)request.Status;
        order.Status = newStatus;
        StampStatusTimestamp(order, newStatus);
        order.UpdatedAtUtc = DateTime.UtcNow;
        order.UpdatedByUserId = actingUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new UpdateMainOrderResult(true, null, await BuildDetailAsync(order, cancellationToken));
    }

    /// <summary>
    /// Toàn bộ sidebar (Trạng thái/Kho TQ/Nhận hàng tại/PPVC) + khối Phí cố định/Phí tùy chọn — nút "Cập nhật"
    /// duy nhất ở trang chi tiết gọi API này, lưu hết trong 1 request/1 transaction thay vì tách /info + /fees.
    /// </summary>
    public async Task<UpdateMainOrderResult> UpdateInfoAsync(Guid orderId, UpdateMainOrderInfoRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        if (!Enum.IsDefined(typeof(MainOrderStatus), request.Status))
        {
            return new UpdateMainOrderResult(false, "Trạng thái không hợp lệ.", null);
        }

        var chinaWarehouseValid = await _dbContext.Warehouses.AnyAsync(
            w => w.Id == request.ChinaWarehouseId && w.Type == WarehouseType.China && w.IsActive && !w.IsDeleted, cancellationToken);
        if (!chinaWarehouseValid)
        {
            return new UpdateMainOrderResult(false, "Kho Trung Quốc không hợp lệ.", null);
        }

        var vietnamWarehouseValid = await _dbContext.Warehouses.AnyAsync(
            w => w.Id == request.VietnamWarehouseId && w.Type == WarehouseType.Vietnam && w.IsActive && !w.IsDeleted, cancellationToken);
        if (!vietnamWarehouseValid)
        {
            return new UpdateMainOrderResult(false, "Kho Việt Nam không hợp lệ.", null);
        }

        var shippingMethodValid = await _dbContext.ShippingMethods.AnyAsync(
            s => s.Id == request.ShippingMethodId && s.IsActive && !s.IsDeleted, cancellationToken);
        if (!shippingMethodValid)
        {
            return new UpdateMainOrderResult(false, "Phương thức vận chuyển không hợp lệ.", null);
        }

        if (request.ShippingFeeCnCny < 0 || request.ShippingFeeVn < 0 || request.ActualPurchaseAmountCny < 0
            || request.PackagingFeeAmount < 0 || request.HomeDeliveryFeeAmount < 0
            || request.DepositAmount < 0 || request.AmountPaid < 0)
        {
            return new UpdateMainOrderResult(false, "Các khoản tiền không được âm.", null);
        }

        var order = await _dbContext.MainOrders
            .Include(o => o.Products)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
        if (order is null)
        {
            return new UpdateMainOrderResult(false, "Không tìm thấy đơn hàng.", null);
        }

        // Tiền đã trả liên quan trực tiếp đến công nợ/kế toán — chỉ Admin được sửa, staff khác gửi giá
        // trị khác với hiện tại sẽ bị chặn ở đây (chặn ở backend, không chỉ ẩn nút trên UI).
        if (request.AmountPaid != order.AmountPaid)
        {
            var actingUser = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == actingUserId, cancellationToken);
            if (actingUser is null || actingUser.Role != Role.Admin)
            {
                return new UpdateMainOrderResult(false, "Chỉ Admin mới được sửa Tiền đã trả.", null);
            }
        }

        var newStatus = (MainOrderStatus)request.Status;
        order.Status = newStatus;
        StampStatusTimestamp(order, newStatus);
        order.ChinaWarehouseId = request.ChinaWarehouseId;
        order.VietnamWarehouseId = request.VietnamWarehouseId;
        order.ShippingMethodId = request.ShippingMethodId;

        order.ShippingFeeCnCny = request.ShippingFeeCnCny;
        order.ShippingFeeVn = request.ShippingFeeVn;
        order.ActualPurchaseAmountCny = request.ActualPurchaseAmountCny;
        order.RequestCheckProduct = request.RequestCheckProduct;
        order.RequestPackaging = request.RequestPackaging;
        // Phí đóng gói/giao hàng nhập tay — chỉ giữ số tiền khi dịch vụ đang được yêu cầu, bỏ chọn thì về 0
        // thay vì giữ lại giá trị cũ ẩn trong nền (tránh cộng nhầm vào TotalAmount lần cập nhật sau).
        order.PackagingFeeAmount = request.RequestPackaging ? request.PackagingFeeAmount : 0;
        order.RequestInsurance = request.RequestInsurance;
        order.RequestHomeDelivery = request.RequestHomeDelivery;
        order.HomeDeliveryFeeAmount = request.RequestHomeDelivery ? request.HomeDeliveryFeeAmount : 0;

        order.DepositAmount = request.DepositAmount;
        order.AmountPaid = request.AmountPaid;

        await RecalculateTotalsAsync(order, cancellationToken);
        order.UpdatedAtUtc = DateTime.UtcNow;
        order.UpdatedByUserId = actingUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new UpdateMainOrderResult(true, null, await BuildDetailAsync(order, cancellationToken));
    }

    /// <summary>Ghi mốc thời gian lần đầu đơn tới trạng thái này — giữ nguyên nếu staff chọn lại trạng thái đã qua trước đó.</summary>
    private static void StampStatusTimestamp(MainOrder order, MainOrderStatus status)
    {
        var now = DateTime.UtcNow;
        switch (status)
        {
            case MainOrderStatus.AwaitingDeposit: order.AwaitingDepositAtUtc ??= now; break;
            case MainOrderStatus.Deposited: order.DepositedAtUtc ??= now; break;
            case MainOrderStatus.Purchased: order.PurchasedAtUtc ??= now; break;
            case MainOrderStatus.AwaitingShopShipment: order.AwaitingShopShipmentAtUtc ??= now; break;
            case MainOrderStatus.ShopShipped: order.ShopShippedAtUtc ??= now; break;
            case MainOrderStatus.ArrivedChinaWarehouse: order.ArrivedChinaWarehouseAtUtc ??= now; break;
            case MainOrderStatus.InTransitToVietnam: order.InTransitToVietnamAtUtc ??= now; break;
            case MainOrderStatus.ArrivedVietnamWarehouse: order.ArrivedVietnamWarehouseAtUtc ??= now; break;
            case MainOrderStatus.Paid: order.PaidAtUtc ??= now; break;
            case MainOrderStatus.Completed: order.CompletedAtUtc ??= now; break;
            case MainOrderStatus.Complaint: order.ComplaintAtUtc ??= now; break;
            case MainOrderStatus.Cancelled: order.CancelledAtUtc ??= now; break;
        }
    }

    /// <summary>
    /// Tính lại toàn bộ số tiền phụ thuộc (ProductAmount/PurchaseFee/Insurance/CheckProduct/Total/Deposit) sau khi
    /// sửa sản phẩm hoặc phí — dùng lại đúng logic bậc phí như lúc tạo đơn (CalculatePricingAsync), chỉ khác là
    /// tỷ giá lấy từ order.ExchangeRateApplied (đã khoá/staff tự sửa) thay vì tính lại từ khách hàng/cấu hình,
    /// và % cọc tối thiểu giữ nguyên giá trị lúc tạo đơn (không đổi theo hạng khách hiện tại).
    /// </summary>
    private async Task RecalculateTotalsAsync(MainOrder order, CancellationToken cancellationToken)
    {
        var customer = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == order.UserId, cancellationToken)
            ?? throw new InvalidOperationException("Không tìm thấy khách hàng của đơn.");
        var config = await _dbContext.SystemConfigs.AsNoTracking().FirstAsync(cancellationToken);

        // ShippingFeeCn/ActualPurchaseAmountVnd luôn suy ra từ số ¥ gốc (staff chỉ nhập ¥) × tỷ giá hiện tại
        // của đơn — đồng bộ lại mỗi khi RecalculateTotalsAsync chạy (kể cả khi chỉ đổi tỷ giá qua
        // UpdateExchangeRateAsync), không lệch nhau giữa 2 đơn vị.
        order.ShippingFeeCn = order.ShippingFeeCnCny * order.ExchangeRateApplied;
        order.ActualPurchaseAmountVnd = order.ActualPurchaseAmountCny * order.ExchangeRateApplied;

        order.ProductAmountCny = order.Products.Sum(p => p.UnitPriceCny * p.Quantity);
        order.ProductAmount = order.ProductAmountCny * order.ExchangeRateApplied;

        decimal feePercent;
        if (customer.CustomPurchaseFeePercent is > 0)
        {
            feePercent = customer.CustomPurchaseFeePercent.Value;
        }
        else
        {
            var tier = await _dbContext.FeeBuyPros
                .AsNoTracking()
                .Where(t => t.IsActive && !t.IsDeleted && order.ProductAmount >= t.PriceFrom && order.ProductAmount < t.PriceTo)
                .FirstOrDefaultAsync(cancellationToken);
            feePercent = tier?.Percent ?? 0;
        }

        var purchaseFeeAmount = order.ProductAmount * feePercent / 100m;

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

        order.PurchaseFeePercentApplied = feePercent;
        order.PurchaseFeeAmount = purchaseFeeAmount;

        order.InsuranceFeeAmount = order.RequestInsurance
            ? order.ProductAmount * config.PurchaseInsurancePercent / 100m
            : 0;

        order.CheckProductFeeAmount = order.RequestCheckProduct
            ? await CalculateCheckProductFeeAsync(order.Products, cancellationToken)
            : 0;

        order.TotalAmount = order.ProductAmount + order.PurchaseFeeAmount + order.ShippingFeeCn + order.ShippingFeeVn
            + order.InsuranceFeeAmount + order.CheckProductFeeAmount + order.PackagingFeeAmount + order.HomeDeliveryFeeAmount;

        // DepositAmount KHÔNG tự tính lại ở đây nữa — staff sửa tay được ở trang chi tiết (xem comment
        // trên MainOrder.DepositAmount), tính lại theo % mỗi lần sửa sản phẩm/phí sẽ đè mất giá trị đó.
    }

    private async Task<MainOrderDetail> BuildDetailAsync(MainOrder order, CancellationToken cancellationToken)
    {
        var userIds = new List<Guid> { order.UserId };
        if (order.OrderStaffId is { } os) userIds.Add(os);
        if (order.SalesStaffId is { } ss) userIds.Add(ss);
        var usernames = await _dbContext.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName!, cancellationToken);

        var warehouseIds = new List<Guid>();
        if (order.ChinaWarehouseId is { } cw) warehouseIds.Add(cw);
        if (order.VietnamWarehouseId is { } vw) warehouseIds.Add(vw);
        var warehouseNames = await _dbContext.Warehouses.AsNoTracking()
            .Where(w => warehouseIds.Contains(w.Id))
            .ToDictionaryAsync(w => w.Id, w => w.Name, cancellationToken);

        var shippingMethodName = order.ShippingMethodId is { } smId
            ? await _dbContext.ShippingMethods.AsNoTracking().Where(s => s.Id == smId).Select(s => s.Name).FirstOrDefaultAsync(cancellationToken)
            : null;

        return new MainOrderDetail(
            order.Id,
            order.OrderNumber,
            order.OrderCode,
            order.UserId,
            usernames.GetValueOrDefault(order.UserId, "—"),
            (int)order.OrderType,
            (int)order.CreationType,
            (int)order.Status,
            order.ChinaWarehouseId,
            order.ChinaWarehouseId is { } cwId ? warehouseNames.GetValueOrDefault(cwId) : null,
            order.VietnamWarehouseId,
            order.VietnamWarehouseId is { } vwId ? warehouseNames.GetValueOrDefault(vwId) : null,
            order.ShippingMethodId,
            shippingMethodName,
            order.OrderStaffId,
            order.OrderStaffId is { } osId ? usernames.GetValueOrDefault(osId) : null,
            order.SalesStaffId,
            order.SalesStaffId is { } ssId ? usernames.GetValueOrDefault(ssId) : null,
            order.Products
                .OrderBy(p => p.CreatedAtUtc)
                .Select(p => new MainOrderProductDetail(p.Id, p.ImageUrl, p.ProductLink, p.ProductName, p.Attributes, p.UnitPriceCny, p.Quantity, p.Note))
                .ToList(),
            order.ExchangeRateApplied,
            order.ProductAmountCny,
            order.ProductAmount,
            order.PurchaseFeePercentApplied,
            order.PurchaseFeeAmount,
            order.ShippingFeeCnCny,
            order.ShippingFeeCn,
            order.ShippingFeeVn,
            order.RequestCheckProduct,
            order.CheckProductFeeAmount,
            order.RequestPackaging,
            order.PackagingFeeAmount,
            order.RequestInsurance,
            order.InsuranceFeeAmount,
            order.RequestHomeDelivery,
            order.HomeDeliveryFeeAmount,
            order.ActualPurchaseAmountCny,
            order.ActualPurchaseAmountVnd,
            // Tiền hoa hồng = Tiền hàng web + Phí ship TQ - Tiền mua thật (đều quy về VNĐ) — chênh lệch
            // giữa số báo giá cho khách và số thực tế bỏ ra mua hàng, không lưu cột riêng vì luôn suy ra
            // được từ 3 số đã lưu.
            order.ProductAmount + order.ShippingFeeCn - order.ActualPurchaseAmountVnd,
            order.TotalAmount,
            order.MinDepositPercentApplied,
            order.DepositAmount,
            order.AmountPaid,
            order.TotalAmount - order.AmountPaid,
            order.Note,
            order.CreatedAtUtc);
    }

    /// <summary>
    /// <paramref name="allowZeroQuantity"/>: true khi sửa đơn đã tồn tại (trang chi tiết) — 0 là giá trị hợp lệ,
    /// dùng để đánh dấu 1 dòng "Hết hàng" mà vẫn giữ lại dòng gốc thay vì xoá. Tạo đơn mới (Create) không cho
    /// phép 0 vì không có lý do gì thêm sẵn 1 sản phẩm hết hàng ngay từ đầu.
    /// </summary>
    private static string? ValidateProducts(IReadOnlyList<MainOrderProductInput> products, bool allowZeroQuantity = false)
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

            var minQuantity = allowZeroQuantity ? 0 : 1;
            if (p.Quantity < minQuantity)
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

    private Task<decimal> CalculateCheckProductFeeAsync(IReadOnlyList<MainOrderProduct> products, CancellationToken cancellationToken) =>
        CalculateCheckProductFeeAsync(
            products.Select(p => new MainOrderProductInput(p.ImageUrl, p.ProductLink, p.ProductName, p.Attributes, p.UnitPriceCny, p.Quantity, p.Note)).ToList(),
            cancellationToken);

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
