using OrderChina.Shared.Application.Orders.Dtos;

namespace OrderChina.Shared.Application.Orders;

public interface IMainOrderService
{
    Task<PreviewMainOrderResult> PreviewAsync(PreviewMainOrderRequest request, CancellationToken cancellationToken = default);

    Task<CreateMainOrderResult> CreateAsync(CreateMainOrderRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<MainOrderListResult> GetListAsync(int page, int pageSize, CancellationToken cancellationToken = default);

    Task<UpdateMainOrderStaffResult> UpdateStaffAsync(Guid orderId, UpdateMainOrderStaffRequest request, Guid actingUserId, CancellationToken cancellationToken = default);
}
