namespace OrderChina.Shared.Domain.Auth;

/// <summary>
/// Hành động dùng chung cho mọi PermitObject (View, Create, Update, Delete, Export...).
/// </summary>
public class Permission
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    public ICollection<UserGroupPermission> UserGroupPermissions { get; set; } = new List<UserGroupPermission>();
}
