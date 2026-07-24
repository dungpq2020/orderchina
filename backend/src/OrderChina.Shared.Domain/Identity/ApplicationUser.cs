using Microsoft.AspNetCore.Identity;

namespace OrderChina.Shared.Domain.Identity;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;

    public string? Address { get; set; }

    public UserType UserType { get; set; }

    /// <summary>
    /// Quyền hạn chi tiết (Admin/Khách hàng/Nhân viên kinh doanh/.../Kế toán) — luôn đồng bộ với
    /// UserType (Role=Customer ⇔ UserType=Customer, mọi giá trị khác ⇔ UserType=Staff).
    /// </summary>
    public Role Role { get; set; } = Role.Customer;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Trạng thái tài khoản — chỉ Active mới được phép đăng nhập (kiểm tra trong AuthService.LoginAsync).
    /// Mặc định Active để không chặn khách hàng đã tự đăng ký qua CustomerApi.
    /// </summary>
    public AccountStatus Status { get; set; } = AccountStatus.Active;

    /// <summary>
    /// Cấp độ khách hàng (VIP 0, 1, 2...) — dùng cho chính sách ưu đãi riêng. Mặc định 0.
    /// </summary>
    public int Tier { get; set; }

    public decimal? CustomExchangeRate { get; set; }

    public decimal? CustomPurchaseFeePercent { get; set; }

    public decimal? CustomWeightFeePerKg { get; set; }

    public decimal? CustomVolumeFeePerCbm { get; set; }

    /// <summary>
    /// Nhân viên kinh doanh/đặt hàng phụ trách — lưu thô Guid (Id của 1 ApplicationUser có UserType=Staff),
    /// không khai báo navigation/FK constraint để tránh phức tạp hoá model Identity tự-tham-chiếu.
    /// </summary>
    public Guid? SalesStaffId { get; set; }

    public Guid? OrderStaffId { get; set; }

    public Guid? ChinaWarehouseId { get; set; }

    public Guid? VietnamWarehouseId { get; set; }

    public Guid? ShippingMethodId { get; set; }

    /// <summary>
    /// Số dư ví điện tử — dùng để thanh toán đơn hàng, KHÔNG sửa trực tiếp qua form cập nhật
    /// thông tin khách hàng. Chỉ thay đổi qua API điều chỉnh ví riêng.
    /// </summary>
    public decimal WalletBalance { get; set; }

    /// <summary>
    /// Bắt buộc 2FA áp dụng cho tài khoản này. Mặc định false ở Phase 1 (optional);
    /// bật ép buộc cho Staff qua cấu hình Auth:RequireTwoFactorForStaff khi seed/nâng cấp tài khoản.
    /// </summary>
    public bool RequireTwoFactor { get; set; }
}
