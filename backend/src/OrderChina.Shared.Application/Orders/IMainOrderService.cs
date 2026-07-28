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

    Task<UpdateMainOrderStaffResult> UpdateStaffAsync(Guid orderId, UpdateMainOrderStaffRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<GetMainOrderResult> GetByIdAsync(Guid orderId, CancellationToken cancellationToken = default);

    Task<UpdateMainOrderResult> UpdateProductsAsync(Guid orderId, UpdateMainOrderProductsRequest request, Guid actingUserId, CancellationToken cancellationToken = default);


    Task<UpdateMainOrderResult> UpdateExchangeRateAsync(Guid orderId, UpdateMainOrderExchangeRateRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<UpdateMainOrderResult> UpdateStatusAsync(Guid orderId, UpdateMainOrderStatusRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<UpdateMainOrderResult> UpdateInfoAsync(Guid orderId, UpdateMainOrderInfoRequest request, Guid actingUserId, CancellationToken cancellationToken = default);
}
