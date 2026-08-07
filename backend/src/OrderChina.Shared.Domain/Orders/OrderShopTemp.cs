namespace OrderChina.Shared.Domain.Orders;

/// <summary>
/// Giỏ hàng tạm — gom các sản phẩm khách "Thêm vào giỏ" (qua extension từ trang chi tiết Taobao/1688)
/// theo từng shop. Mỗi shop khi khách bấm "Chốt đơn" sẽ tách thành 1 <see cref="MainOrder"/> riêng
/// (CreationType = Extension), giống luồng mua hộ thật — xoá khỏi giỏ ngay sau khi tạo đơn thành công.
/// </summary>
public class OrderShopTemp
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string ShopName { get; set; } = string.Empty;

    public string? ShopLink { get; set; }

    /// <summary>"Taobao" | "1688" — nguồn shop, extension xác định qua domain trang sản phẩm.</summary>
    public string Platform { get; set; } = string.Empty;

    /// <summary>Dịch vụ tuỳ chọn cho shop này — chọn ngay ở giỏ hàng, giữ nguyên khi "Chốt đơn" (không phải chọn lại ở bước checkout).</summary>
    public bool RequestPackaging { get; set; }

    public bool RequestInsurance { get; set; }

    public bool RequestCheckProduct { get; set; }

    public bool RequestHomeDelivery { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }

    public List<ProductTemp> Products { get; set; } = new();
}
