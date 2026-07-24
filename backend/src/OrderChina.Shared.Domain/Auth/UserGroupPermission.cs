namespace OrderChina.Shared.Domain.Auth;

/// <summary>
/// Grant: 1 UserGroup có quyền (Permission) cụ thể trên 1 PermitObject.
/// Ví dụ: UserGroup "Saler" + PermitObject "MainOrder" + Permission "Update" → claim "MainOrder.Update".
/// </summary>
public class UserGroupPermission
{
    public Guid Id { get; set; }

    public Guid UserGroupId { get; set; }
    public UserGroup UserGroup { get; set; } = null!;

    public Guid PermitObjectId { get; set; }
    public PermitObject PermitObject { get; set; } = null!;

    public Guid PermissionId { get; set; }
    public Permission Permission { get; set; } = null!;
}
