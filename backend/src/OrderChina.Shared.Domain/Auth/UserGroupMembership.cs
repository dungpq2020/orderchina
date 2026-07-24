using OrderChina.Shared.Domain.Identity;

namespace OrderChina.Shared.Domain.Auth;

public class UserGroupMembership
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public Guid UserGroupId { get; set; }
    public UserGroup UserGroup { get; set; } = null!;

    public DateTime AssignedAtUtc { get; set; } = DateTime.UtcNow;
}
