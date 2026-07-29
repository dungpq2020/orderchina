namespace OrderChina.Shared.Domain.Orders;

/// <summary>Trạng thái riêng của 1 mã vận đơn — 1 đơn (mua hộ hoặc ký gửi) có thể gồm nhiều mã vận đơn về kho ở các thời điểm khác nhau.</summary>
public enum TrackingCodeStatus
{
    New = 1,
    ArrivedChinaWarehouse = 2,
    InTransitToVietnam = 3,
    ArrivedVietnamWarehouse = 4,
    DeliveredToCustomer = 5,
}
