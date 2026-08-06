using OrderChina.Shared.Application.Users.Dtos;

namespace OrderChina.Shared.Application.Users;

/// <summary>
/// Khách tự cập nhật hồ sơ của chính mình (Họ tên/Email/SĐT/Địa chỉ) — tách riêng khỏi
/// <see cref="ICustomerDirectoryService.UpdateCustomerAsync"/> vì DTO đó còn có các trường chỉ Staff mới
/// được sửa (Tier, phí riêng, NV phụ trách, Trạng thái, Role...); lộ chung ra API tự sửa hồ sơ sẽ là lỗ
/// hổng cho khách tự leo quyền/tự đổi phí.
/// </summary>
public interface ICustomerProfileService
{
    Task<UpdateMyProfileResult> UpdateMyProfileAsync(Guid userId, UpdateMyProfileRequest request, CancellationToken cancellationToken = default);
}
