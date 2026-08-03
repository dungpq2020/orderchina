namespace OrderChina.Shared.Domain.Orders;

/// <summary>
/// 1 dòng lịch sử thao tác của 1 đơn hàng — ghi lại MỌI hành động làm thay đổi dữ liệu đơn (tạo đơn, sửa
/// sản phẩm, đổi trạng thái, kiểm/xuất kho, thanh toán...) để nhân viên tracking tra soát ai đã làm gì lúc
/// nào. Chỉ lưu 1 dòng mô tả ngắn (không diff từng field) — đủ để biết loại thao tác + người + thời điểm.
/// </summary>
public class MainOrderActivityLog
{
    public Guid Id { get; set; }

    public Guid MainOrderId { get; set; }

    public string Description { get; set; } = string.Empty;

    public Guid PerformedByUserId { get; set; }

    public DateTime PerformedAtUtc { get; set; } = DateTime.UtcNow;
}
