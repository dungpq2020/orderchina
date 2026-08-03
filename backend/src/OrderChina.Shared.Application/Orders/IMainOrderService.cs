using OrderChina.Shared.Application.Orders.Dtos;

namespace OrderChina.Shared.Application.Orders;

public interface IMainOrderService
{
    Task<PreviewMainOrderResult> PreviewAsync(PreviewMainOrderRequest request, CancellationToken cancellationToken = default);

    Task<CreateMainOrderResult> CreateAsync(CreateMainOrderRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    /// <summary>Trang "Đơn hàng mua hộ" (admin) — lọc theo trạng thái/NV đặt hàng/NV kinh doanh/khoảng ngày
    /// tạo đơn, tìm theo mã đơn, tài khoản, SĐT, mã vận đơn hoặc mã shop trong 1 ô search.</summary>
    Task<MainOrderListResult> GetListAsync(
        int page, int pageSize, int? status = null, string? search = null,
        Guid? orderStaffId = null, Guid? salesStaffId = null,
        DateTime? fromDate = null, DateTime? toDate = null, CancellationToken cancellationToken = default);

    /// <summary>Trang "Đơn hàng" của customer-web — chỉ trả về đơn của chính khách hàng đó.</summary>
    Task<MainOrderListResult> GetCustomerOrdersAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken = default);

    /// <summary>
    /// Khách tự đặt cọc cho đơn của mình (trừ thẳng WalletBalance, không qua luồng yêu cầu rút tiền) —
    /// chỉ cho phép khi đơn đang ở trạng thái AwaitingDeposit và đúng chủ đơn.
    /// </summary>
    Task<MainOrderDepositResult> DepositAsync(Guid orderId, Guid customerUserId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Trang chi tiết đơn (admin) — staff đặt cọc hộ khách khi khách trả tiền ngoài hệ thống (chuyển
    /// khoản/tiền mặt), vẫn trừ đúng ví của khách sở hữu đơn, không phải ví admin.
    /// </summary>
    Task<MainOrderDepositResult> AdminDepositAsync(Guid orderId, Guid actingUserId, CancellationToken cancellationToken = default);

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

    /// <summary>Trang chi tiết đơn (admin) — staff thanh toán hộ khách, cùng lý do với <see cref="AdminDepositAsync"/>.</summary>
    Task<MainOrderPayResult> AdminPayAsync(Guid orderId, Guid actingUserId, CancellationToken cancellationToken = default);

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

    /// <summary>
    /// Trang "Kiểm hàng kho Trung Quốc" — quét/nhập mã vận đơn (không biết trước orderId), nhập cân nặng +
    /// kích thước, hệ thống tự tra ra đơn qua Code rồi cập nhật cả kiện hàng lẫn đơn hàng trong 1 request.
    /// </summary>
    Task<UpdateMainOrderResult> CheckInTrackingCodeChinaWarehouseAsync(CheckInTrackingCodeChinaWarehouseRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Trang "Xuất kho Trung Quốc" — quét mã vận đơn đã kiểm hàng (ArrivedChinaWarehouse) để xác nhận rời
    /// kho TQ, chuyển sang InTransitToVietnam (cả kiện lẫn đơn hàng) — không sửa cân/kích thước.
    /// </summary>
    Task<UpdateMainOrderResult> ExportTrackingCodeChinaWarehouseAsync(ExportTrackingCodeChinaWarehouseRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Trang "Kiểm kho Việt Nam" — quét mã vận đơn đã xuất kho TQ (InTransitToVietnam) để xác nhận về tới
    /// kho VN, chuyển sang ArrivedVietnamWarehouse (cả kiện lẫn đơn hàng).
    /// </summary>
    Task<UpdateMainOrderResult> CheckInTrackingCodeVietnamWarehouseAsync(CheckInTrackingCodeVietnamWarehouseRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    /// <summary>Tra cứu thuần theo mã vận đơn (không sửa dữ liệu) — dùng ngay sau khi quét để hiển thị ngữ cảnh đơn hàng.</summary>
    Task<TrackingCodeLookupResult> LookupTrackingCodeForChinaWarehouseAsync(string code, CancellationToken cancellationToken = default);

    /// <summary>Trang "Quản lý kiện hàng" — danh sách mã vận đơn của mọi đơn, lọc theo trạng thái + tìm theo mã vận đơn/mã đơn/username.</summary>
    Task<TrackingCodeListResult> GetTrackingCodeListAsync(int page, int pageSize, int? status, string? search, CancellationToken cancellationToken = default);
}
