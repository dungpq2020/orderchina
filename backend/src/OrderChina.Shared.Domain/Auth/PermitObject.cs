namespace OrderChina.Shared.Domain.Auth;

/// <summary>
/// Đại diện 1 nhóm chức năng nghiệp vụ (ví dụ "MainOrder", "TransportationOrder") mà UserGroup
/// có thể được cấp Permission cụ thể lên đó. Code dùng để build permission claim "{Code}.{PermissionCode}".
/// </summary>
public class PermitObject
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<UserGroupPermission> UserGroupPermissions { get; set; } = new List<UserGroupPermission>();
}
