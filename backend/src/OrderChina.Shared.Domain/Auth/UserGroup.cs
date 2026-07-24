namespace OrderChina.Shared.Domain.Auth;

public class UserGroup
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<UserGroupPermission> UserGroupPermissions { get; set; } = new List<UserGroupPermission>();
    public ICollection<UserGroupMembership> Memberships { get; set; } = new List<UserGroupMembership>();
}
