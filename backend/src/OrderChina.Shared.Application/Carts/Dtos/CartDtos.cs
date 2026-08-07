using OrderChina.Shared.Application.Orders.Dtos;

namespace OrderChina.Shared.Application.Carts.Dtos;

public record CartProductItem(
    Guid Id,
    string? ImageUrl,
    string? ProductLink,
    string ProductName,
    string? Attributes,
    decimal UnitPriceCny,
    int Quantity,
    string? Note);

public record CartShopItem(
    Guid Id,
    string ShopName,
    string? ShopLink,
    string Platform,
    IReadOnlyList<CartProductItem> Products,
    decimal TotalAmountCny,
    /// <summary>Chọn ngay ở giỏ hàng, giữ nguyên khi "Chốt đơn" — không phải chọn lại ở bước checkout.</summary>
    MainOrderServiceOptions Services);

/// <summary><paramref name="CartAutoDeleteDays"/>: lấy từ SystemConfig — 0 nghĩa là không tự xoá, dùng để hiện banner cảnh báo ở trang Giỏ hàng.</summary>
public record CartResult(IReadOnlyList<CartShopItem> Shops, int CartAutoDeleteDays);

/// <summary>Extension gọi khi khách bấm "Thêm vào giỏ" ở trang chi tiết sản phẩm Taobao/1688.</summary>
public record AddToCartRequest(
    string ShopName,
    string? ShopLink,
    string Platform,
    string? ImageUrl,
    string? ProductLink,
    string ProductName,
    string? Attributes,
    decimal UnitPriceCny,
    int Quantity,
    string? Note);

public record AddToCartResult(bool Succeeded, string? Error, Guid? ShopTempId);

public record UpdateCartItemRequest(int Quantity, string? Attributes, string? Note);

public record UpdateCartShopServicesRequest(MainOrderServiceOptions Services);

/// <summary>Khách bấm "Chốt đơn" cho 1 shop trong giỏ — dịch vụ tuỳ chọn đã chọn sẵn ở giỏ hàng (xem
/// <see cref="UpdateCartShopServicesRequest"/>), ở đây chỉ còn cần chọn kho/PPVC.</summary>
public record CheckoutCartRequest(
    Guid ChinaWarehouseId,
    Guid VietnamWarehouseId,
    Guid ShippingMethodId,
    string? Note);

public record CheckoutCartResult(bool Succeeded, string? Error, Guid? OrderId, string? OrderCode);
