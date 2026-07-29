using OrderChina.Shared.Application.Orders.Dtos;

namespace OrderChina.Shared.Application.Orders;

public interface IMainOrderService
{
    Task<PreviewMainOrderResult> PreviewAsync(PreviewMainOrderRequest request, CancellationToken cancellationToken = default);

    Task<CreateMainOrderResult> CreateAsync(CreateMainOrderRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<MainOrderListResult> GetListAsync(int page, int pageSize, CancellationToken cancellationToken = default);

    /// <summary>Trang "Đơn hàng" của customer-web — chỉ trả về đơn của chính khách hàng đó.</summary>
    Task<MainOrderListResult> GetCustomerOrdersAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken = default);

    /// <summary>
    /// Khách tự đặt cọc cho đơn của mình (trừ thẳng WalletBalance, không qua luồng yêu cầu rút tiền) —
    /// chỉ cho phép khi đơn đang ở trạng thái AwaitingDeposit và đúng chủ đơn.
    /// </summary>
    Task<MainOrderDepositResult> DepositAsync(Guid orderId, Guid customerUserId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Khách tự huỷ đơn của mình — chỉ cho phép khi đơn chưa đặt cọc (AwaitingQuote/AwaitingDeposit), vì
    /// từ Deposited trở đi khách đã trả tiền thật (cần staff xử lý hoàn tiền, không tự huỷ được).
    /// </summary>
    Task<MainOrderCancelResult> CancelAsync(Guid orderId, Guid customerUserId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Khách tự thanh toán phần còn lại (TotalAmount - AmountPaid) cho đơn của mình — trừ thẳng
    /// WalletBalance, chỉ cho phép khi đơn đã Về kho Việt Nam (ArrivedVietnamWarehouse).
    /// </summary>
    Task<MainOrderPayResult> PayAsync(Guid orderId, Guid customerUserId, CancellationToken cancellationToken = default);

    Task<UpdateMainOrderStaffResult> UpdateStaffAsync(Guid orderId, UpdateMainOrderStaffRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<GetMainOrderResult> GetByIdAsync(Guid orderId, CancellationToken cancellationToken = default);

    Task<UpdateMainOrderResult> UpdateProductsAsync(Guid orderId, UpdateMainOrderProductsRequest request, Guid actingUserId, CancellationToken cancellationToken = default);


    Task<UpdateMainOrderResult> UpdateExchangeRateAsync(Guid orderId, UpdateMainOrderExchangeRateRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<UpdateMainOrderResult> UpdateStatusAsync(Guid orderId, UpdateMainOrderStatusRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<UpdateMainOrderResult> UpdateInfoAsync(Guid orderId, UpdateMainOrderInfoRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    /// <summary>Thêm 1 mã đơn hàng shop Trung Quốc (Taobao/1688...) vào đơn — 1 đơn có thể có nhiều mã shop.</summary>
    /// <summary>Thay toàn bộ danh sách mã shop của đơn (giống UpdateTrackingCodesAsync — replace-all/diff theo Id qua 1 lần Lưu).</summary>
    Task<UpdateMainOrderResult> UpdateShopCodesAsync(Guid orderId, UpdateMainOrderShopCodesRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    /// <summary>Thay toàn bộ danh sách mã vận đơn của đơn (giống UpdateProductsAsync — replace-all theo 1 lần Lưu).</summary>
    Task<UpdateMainOrderResult> UpdateTrackingCodesAsync(Guid orderId, UpdateMainOrderTrackingCodesRequest request, Guid actingUserId, CancellationToken cancellationToken = default);
}
