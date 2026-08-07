using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Carts;
using OrderChina.Shared.Application.Carts.Dtos;
using OrderChina.Shared.Application.Orders;
using OrderChina.Shared.Application.Orders.Dtos;
using OrderChina.Shared.Domain.Orders;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.Shared.Infrastructure.Carts;

public class CartService : ICartService
{
    private readonly AppDbContext _dbContext;
    private readonly IMainOrderService _mainOrderService;

    public CartService(AppDbContext dbContext, IMainOrderService mainOrderService)
    {
        _dbContext = dbContext;
        _mainOrderService = mainOrderService;
    }

    public async Task<CartResult> GetCartAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var cartAutoDeleteDays = await _dbContext.SystemConfigs.Select(c => c.CartAutoDeleteDays).FirstOrDefaultAsync(cancellationToken);

        var shops = await _dbContext.OrderShopTemps
            .Where(s => s.UserId == userId)
            .Include(s => s.Products)
            .ToListAsync(cancellationToken);

        // Mỗi lần khách vào giỏ hàng: dọn các shop đã quá hạn (tính từ CreatedAtUtc) theo cấu hình
        // CartAutoDeleteDays — 0 nghĩa là chưa cấu hình, không tự xoá.
        if (cartAutoDeleteDays > 0)
        {
            var now = DateTime.UtcNow;
            var expiredShops = shops.Where(s => (now - s.CreatedAtUtc).TotalDays > cartAutoDeleteDays).ToList();
            if (expiredShops.Count > 0)
            {
                _dbContext.OrderShopTemps.RemoveRange(expiredShops);
                await _dbContext.SaveChangesAsync(cancellationToken);
                foreach (var expired in expiredShops)
                {
                    shops.Remove(expired);
                }
            }
        }

        var items = shops
            .OrderByDescending(s => s.CreatedAtUtc)
            .Select(s => new CartShopItem(
                s.Id,
                s.ShopName,
                s.ShopLink,
                s.Platform,
                s.Products
                    .OrderBy(p => p.CreatedAtUtc)
                    .Select(p => new CartProductItem(p.Id, p.ImageUrl, p.ProductLink, p.ProductName, p.Attributes, p.UnitPriceCny, p.Quantity, p.Note))
                    .ToList(),
                s.Products.Sum(p => p.UnitPriceCny * p.Quantity),
                new MainOrderServiceOptions(s.RequestPackaging, s.RequestInsurance, s.RequestCheckProduct, s.RequestHomeDelivery)))
            .ToList();

        return new CartResult(items, cartAutoDeleteDays);
    }

    public async Task<AddToCartResult> AddItemAsync(Guid userId, AddToCartRequest request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.ProductName))
        {
            return new AddToCartResult(false, "Vui lòng nhập tên sản phẩm.", null);
        }

        if (request.UnitPriceCny <= 0)
        {
            return new AddToCartResult(false, "Đơn giá không hợp lệ.", null);
        }

        if (request.Quantity <= 0)
        {
            return new AddToCartResult(false, "Số lượng không hợp lệ.", null);
        }

        // Gom theo shop — ưu tiên khớp ShopLink (ổn định hơn tên shop có thể đổi cách hiển thị),
        // rơi về ShopName nếu extension không lấy được link shop.
        var shop = await _dbContext.OrderShopTemps
            .Include(s => s.Products)
            .FirstOrDefaultAsync(
                s => s.UserId == userId && (
                    (request.ShopLink != null && s.ShopLink == request.ShopLink) ||
                    (request.ShopLink == null && s.ShopLink == null && s.ShopName == request.ShopName)),
                cancellationToken);

        if (shop is null)
        {
            shop = new OrderShopTemp
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ShopName = request.ShopName,
                ShopLink = request.ShopLink,
                Platform = request.Platform,
                CreatedAtUtc = DateTime.UtcNow,
            };
            _dbContext.OrderShopTemps.Add(shop);
        }
        else
        {
            shop.UpdatedAtUtc = DateTime.UtcNow;
        }

        // Cùng 1 sản phẩm + cùng thuộc tính (màu/size) đã có trong giỏ shop này thì cộng dồn số lượng,
        // không tạo thêm dòng trùng — so theo productKey đã chuẩn hoá vì link Taobao/1688/Tmall luôn kèm
        // tham số tracking (spm, uuid...) đổi mỗi lần vào lại trang, so nguyên URL sẽ luôn ra "khác nhau".
        var newProductKey = NormalizeProductKey(request.ProductLink);
        var existingProduct = shop.Products.FirstOrDefault(p =>
            NormalizeProductKey(p.ProductLink) == newProductKey &&
            string.Equals(p.Attributes?.Trim() ?? "", request.Attributes?.Trim() ?? "", StringComparison.OrdinalIgnoreCase));

        if (existingProduct is not null)
        {
            existingProduct.Quantity += request.Quantity;
            existingProduct.UnitPriceCny = request.UnitPriceCny;
        }
        else
        {
            _dbContext.ProductTemps.Add(new ProductTemp
            {
                Id = Guid.NewGuid(),
                OrderShopTempId = shop.Id,
                ImageUrl = request.ImageUrl,
                ProductLink = request.ProductLink,
                ProductName = request.ProductName,
                Attributes = request.Attributes,
                UnitPriceCny = request.UnitPriceCny,
                Quantity = request.Quantity,
                Note = request.Note,
                CreatedAtUtc = DateTime.UtcNow,
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new AddToCartResult(true, null, shop.Id);
    }

    /// <summary>
    /// Rút gọn link sản phẩm về "host:id-sản-phẩm" để so khớp trùng lặp — Taobao/Tmall dùng
    /// item.htm?id=xxxx, 1688 dùng /offer/xxxx.html; các tham số còn lại (spm, tracking...) đổi mỗi
    /// lần vào lại trang nên không thể so nguyên URL. Không nhận diện được dạng nào thì rơi về host+path
    /// (bỏ query) — vẫn tốt hơn so nguyên URL kèm tracking param.
    /// </summary>
    private static string? NormalizeProductKey(string? productLink)
    {
        if (string.IsNullOrWhiteSpace(productLink))
        {
            return null;
        }

        if (!Uri.TryCreate(productLink, UriKind.Absolute, out var uri))
        {
            return productLink.Trim();
        }

        var idMatch = System.Text.RegularExpressions.Regex.Match(uri.Query, @"[?&]id=(\d+)");
        if (idMatch.Success)
        {
            return $"{uri.Host}:{idMatch.Groups[1].Value}";
        }

        var offerMatch = System.Text.RegularExpressions.Regex.Match(uri.AbsolutePath, @"/offer/(\d+)\.html");
        if (offerMatch.Success)
        {
            return $"{uri.Host}:{offerMatch.Groups[1].Value}";
        }

        return $"{uri.Host}{uri.AbsolutePath}";
    }

    public async Task<bool> UpdateItemAsync(Guid userId, Guid productTempId, UpdateCartItemRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Quantity <= 0)
        {
            return false;
        }

        var product = await _dbContext.ProductTemps.FirstOrDefaultAsync(p => p.Id == productTempId, cancellationToken);
        if (product is null)
        {
            return false;
        }

        var ownsShop = await _dbContext.OrderShopTemps.AnyAsync(s => s.Id == product.OrderShopTempId && s.UserId == userId, cancellationToken);
        if (!ownsShop)
        {
            return false;
        }

        product.Quantity = request.Quantity;
        product.Attributes = request.Attributes;
        product.Note = request.Note;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RemoveItemAsync(Guid userId, Guid productTempId, CancellationToken cancellationToken = default)
    {
        var product = await _dbContext.ProductTemps.FirstOrDefaultAsync(p => p.Id == productTempId, cancellationToken);
        if (product is null)
        {
            return false;
        }

        var shop = await _dbContext.OrderShopTemps.FirstOrDefaultAsync(s => s.Id == product.OrderShopTempId && s.UserId == userId, cancellationToken);
        if (shop is null)
        {
            return false;
        }

        _dbContext.ProductTemps.Remove(product);

        var remainingCount = await _dbContext.ProductTemps.CountAsync(p => p.OrderShopTempId == shop.Id && p.Id != productTempId, cancellationToken);
        if (remainingCount == 0)
        {
            _dbContext.OrderShopTemps.Remove(shop);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RemoveShopAsync(Guid userId, Guid shopTempId, CancellationToken cancellationToken = default)
    {
        var shop = await _dbContext.OrderShopTemps.FirstOrDefaultAsync(s => s.Id == shopTempId && s.UserId == userId, cancellationToken);
        if (shop is null)
        {
            return false;
        }

        _dbContext.OrderShopTemps.Remove(shop);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> UpdateShopServicesAsync(Guid userId, Guid shopTempId, UpdateCartShopServicesRequest request, CancellationToken cancellationToken = default)
    {
        var shop = await _dbContext.OrderShopTemps.FirstOrDefaultAsync(s => s.Id == shopTempId && s.UserId == userId, cancellationToken);
        if (shop is null)
        {
            return false;
        }

        shop.RequestPackaging = request.Services.RequestPackaging;
        shop.RequestInsurance = request.Services.RequestInsurance;
        shop.RequestCheckProduct = request.Services.RequestCheckProduct;
        shop.RequestHomeDelivery = request.Services.RequestHomeDelivery;
        shop.UpdatedAtUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<CheckoutCartResult> CheckoutAsync(Guid userId, Guid shopTempId, CheckoutCartRequest request, CancellationToken cancellationToken = default)
    {
        var shop = await _dbContext.OrderShopTemps
            .Include(s => s.Products)
            .FirstOrDefaultAsync(s => s.Id == shopTempId && s.UserId == userId, cancellationToken);
        if (shop is null)
        {
            return new CheckoutCartResult(false, "Không tìm thấy giỏ hàng.", null, null);
        }

        if (shop.Products.Count == 0)
        {
            return new CheckoutCartResult(false, "Giỏ hàng của shop này đang trống.", null, null);
        }

        var products = shop.Products
            .Select(p => new MainOrderProductInput(p.ImageUrl, p.ProductLink, p.ProductName, p.Attributes, p.UnitPriceCny, p.Quantity, p.Note))
            .ToList();

        var services = new MainOrderServiceOptions(shop.RequestPackaging, shop.RequestInsurance, shop.RequestCheckProduct, shop.RequestHomeDelivery);
        var createRequest = new CreateMainOrderRequest(
            userId,
            products,
            request.ChinaWarehouseId,
            request.VietnamWarehouseId,
            request.ShippingMethodId,
            services,
            request.Note);

        var result = await _mainOrderService.CreateFromCartAsync(createRequest, userId, cancellationToken);
        if (!result.Succeeded)
        {
            return new CheckoutCartResult(false, result.Error, null, null);
        }

        _dbContext.OrderShopTemps.Remove(shop);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new CheckoutCartResult(true, null, result.OrderId, result.OrderCode);
    }
}
