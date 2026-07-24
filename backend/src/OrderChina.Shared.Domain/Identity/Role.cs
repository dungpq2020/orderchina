namespace OrderChina.Shared.Domain.Identity;

/// <summary>
/// Quyền hạn thống nhất toàn hệ thống — bao gồm cả Admin/Khách hàng lẫn các vai trò Staff cụ thể.
/// UserType (Staff/Customer) vẫn giữ nguyên để tách API theo audience (AdminApi/CustomerApi);
/// Role là giá trị mô tả chi tiết hơn, luôn đồng bộ: Role=Customer → UserType=Customer,
/// mọi Role khác → UserType=Staff.
/// </summary>
public enum Role
{
    Admin = 0,
    Customer = 1,
    SalesStaff = 2,
    PurchasingStaff = 3,
    ChinaWarehouseStaff = 4,
    VietnamWarehouseStaff = 5,
    Accountant = 6
}
