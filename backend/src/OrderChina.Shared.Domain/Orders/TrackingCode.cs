namespace OrderChina.Shared.Domain.Orders;

/// <summary>
/// 1 mã vận đơn (kiện hàng) — dùng chung cho cả đơn mua hộ (<see cref="MainOrderId"/>) lẫn đơn ký gửi
/// (<see cref="TransportOrderId"/>, bảng riêng CHƯA xây) bằng 2 cột FK nullable, đúng 1 trong 2 có giá
/// trị tại 1 thời điểm — hiện tại chỉ MainOrderId được dùng, TransportOrderId luôn null cho tới khi có
/// đơn ký gửi. 1 đơn có thể tách thành nhiều kiện/mã vận đơn khác nhau, mỗi kiện có cân nặng/kích thước
/// và tiến trình về kho riêng.
/// </summary>
public class TrackingCode
{
    public Guid Id { get; set; }

    public Guid? MainOrderId { get; set; }

    /// <summary>Dành cho đơn ký gửi — CHƯA xây bảng, luôn null hiện tại.</summary>
    public Guid? TransportOrderId { get; set; }

    public string Code { get; set; } = string.Empty;

    public decimal WeightKg { get; set; }

    public decimal LengthCm { get; set; }

    public decimal WidthCm { get; set; }

    public decimal HeightCm { get; set; }

    /// <summary>
    /// Cân quy đổi (kg) = Dài×Rộng×Cao / SystemConfig.VolumetricWeightDivisor — TÍNH SẴN và lưu ở đây
    /// (không tính lại từ cấu hình hiện tại mỗi lần đọc), chỉ tính lại khi Dài/Rộng/Cao thực sự đổi, để
    /// sau này đổi số chia trong cấu hình chung không làm sai lệch dữ liệu mã vận đơn cũ.
    /// </summary>
    public decimal VolumetricWeightKg { get; set; }

    public TrackingCodeStatus Status { get; set; } = TrackingCodeStatus.New;

    // Mốc thời gian lần đầu đạt mỗi trạng thái — cùng cách làm với MainOrder.*AtUtc. New dùng luôn
    // CreatedAtUtc (giống MainOrderStatus.AwaitingQuote), không cần cột riêng.
    public DateTime? ArrivedChinaWarehouseAtUtc { get; set; }

    public DateTime? InTransitToVietnamAtUtc { get; set; }

    public DateTime? ArrivedVietnamWarehouseAtUtc { get; set; }

    public DateTime? DeliveredToCustomerAtUtc { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Guid CreatedByUserId { get; set; }
}
