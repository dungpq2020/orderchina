namespace OrderChina.Shared.Domain.Orders;

/// <summary>
/// Nguồn tạo đơn — quyết định trạng thái khởi tạo: Extension bỏ qua bước báo giá (đã có giá thực khi
/// khách bấm tạo từ trang sản phẩm), Manual (staff tạo hộ) cần bước Chờ báo giá trước khi khách đặt cọc.
/// </summary>
public enum MainOrderCreationType
{
    Extension = 1,
    Manual = 2
}
