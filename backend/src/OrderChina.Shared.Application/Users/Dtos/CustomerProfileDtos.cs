namespace OrderChina.Shared.Application.Users.Dtos;

public record UpdateMyProfileRequest(string FullName, string Email, string PhoneNumber, string? Address);

/// <summary>Kho TQ/Kho VN/PTVC/NV sale chỉ để hiển thị — do Staff gán, khách không tự sửa được từ trang này.</summary>
public record MyProfile(
    string Username,
    string FullName,
    string? Email,
    string? PhoneNumber,
    string? Address,
    string? ChinaWarehouseName,
    string? VietnamWarehouseName,
    string? ShippingMethodName,
    string? SalesStaffName);

public record UpdateMyProfileResult(bool Succeeded, string? Error, MyProfile? Profile);
