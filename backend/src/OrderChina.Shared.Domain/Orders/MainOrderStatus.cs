namespace OrderChina.Shared.Domain.Orders;

/// <summary>
/// Toàn bộ vòng đời xử lý đơn mua hộ, theo đúng thứ tự luồng thực tế (trừ Complaint/Cancelled có thể
/// xảy ra xen giữa bất kỳ lúc nào). Mỗi lần đổi trạng thái ghi 1 dòng <see cref="MainOrderStatusHistory"/>
/// kèm mốc thời gian riêng — không dùng chung 1 timestamp cho cả đơn.
/// </summary>
public enum MainOrderStatus
{
    /// <summary>Chờ báo giá — chỉ áp dụng đơn tạo thủ công (CreationType=Manual), cần staff xác nhận giá trước khi khách cọc.</summary>
    AwaitingQuote = 1,

    /// <summary>Chờ đặt cọc — trạng thái khởi tạo của đơn tạo qua extension (CreationType=Extension).</summary>
    AwaitingDeposit = 2,

    Deposited = 3,

    Purchased = 4,

    AwaitingShopShipment = 5,

    ShopShipped = 6,

    ArrivedChinaWarehouse = 7,

    InTransitToVietnam = 8,

    ArrivedVietnamWarehouse = 9,

    Paid = 10,

    Completed = 11,

    Complaint = 12,

    Cancelled = 13
}
