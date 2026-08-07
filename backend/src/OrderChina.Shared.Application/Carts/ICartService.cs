using OrderChina.Shared.Application.Carts.Dtos;

namespace OrderChina.Shared.Application.Carts;

/// <summary>Giỏ hàng của khách — gom sản phẩm "Thêm vào giỏ" từ extension theo shop, chốt từng shop thành 1 MainOrder.</summary>
public interface ICartService
{
    Task<CartResult> GetCartAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<AddToCartResult> AddItemAsync(Guid userId, AddToCartRequest request, CancellationToken cancellationToken = default);

    Task<bool> UpdateItemAsync(Guid userId, Guid productTempId, UpdateCartItemRequest request, CancellationToken cancellationToken = default);

    Task<bool> RemoveItemAsync(Guid userId, Guid productTempId, CancellationToken cancellationToken = default);

    Task<bool> RemoveShopAsync(Guid userId, Guid shopTempId, CancellationToken cancellationToken = default);

    /// <summary>Chọn dịch vụ tuỳ chọn (đóng gói/bảo hiểm/kiểm hàng/giao tận nhà) cho 1 shop trong giỏ.</summary>
    Task<bool> UpdateShopServicesAsync(Guid userId, Guid shopTempId, UpdateCartShopServicesRequest request, CancellationToken cancellationToken = default);

    /// <summary>Chốt đơn — tạo 1 MainOrder (CreationType Extension) từ toàn bộ sản phẩm của 1 shop trong giỏ, rồi xoá khỏi giỏ.</summary>
    Task<CheckoutCartResult> CheckoutAsync(Guid userId, Guid shopTempId, CheckoutCartRequest request, CancellationToken cancellationToken = default);
}
