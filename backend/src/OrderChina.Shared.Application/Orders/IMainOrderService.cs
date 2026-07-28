using OrderChina.Shared.Application.Orders.Dtos;

namespace OrderChina.Shared.Application.Orders;

public interface IMainOrderService
{
    Task<PreviewMainOrderResult> PreviewAsync(PreviewMainOrderRequest request, CancellationToken cancellationToken = default);

    Task<CreateMainOrderResult> CreateAsync(CreateMainOrderRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<MainOrderListResult> GetListAsync(int page, int pageSize, CancellationToken cancellationToken = default);

    Task<UpdateMainOrderStaffResult> UpdateStaffAsync(Guid orderId, UpdateMainOrderStaffRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<GetMainOrderResult> GetByIdAsync(Guid orderId, CancellationToken cancellationToken = default);

    Task<UpdateMainOrderResult> UpdateProductsAsync(Guid orderId, UpdateMainOrderProductsRequest request, Guid actingUserId, CancellationToken cancellationToken = default);


    Task<UpdateMainOrderResult> UpdateExchangeRateAsync(Guid orderId, UpdateMainOrderExchangeRateRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<UpdateMainOrderResult> UpdateStatusAsync(Guid orderId, UpdateMainOrderStatusRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<UpdateMainOrderResult> UpdateInfoAsync(Guid orderId, UpdateMainOrderInfoRequest request, Guid actingUserId, CancellationToken cancellationToken = default);
}
