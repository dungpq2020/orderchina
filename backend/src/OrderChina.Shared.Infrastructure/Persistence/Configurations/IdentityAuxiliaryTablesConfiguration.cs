using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

/// <summary>
/// EFCore.NamingConventions không rewrite tên bảng đã được set tường minh — mà Identity's
/// IdentityUserContext tự set tên bảng mặc định "AspNetUserClaims/Logins/Tokens" tường minh trong
/// base.OnModelCreating(), nên cần override lại ở đây để đồng bộ snake_case với toàn bộ schema còn lại.
/// </summary>
public class IdentityAuxiliaryTablesConfiguration :
    IEntityTypeConfiguration<IdentityUserClaim<Guid>>,
    IEntityTypeConfiguration<IdentityUserLogin<Guid>>,
    IEntityTypeConfiguration<IdentityUserToken<Guid>>
{
    public void Configure(EntityTypeBuilder<IdentityUserClaim<Guid>> builder) => builder.ToTable("user_claims");

    public void Configure(EntityTypeBuilder<IdentityUserLogin<Guid>> builder) => builder.ToTable("user_logins");

    public void Configure(EntityTypeBuilder<IdentityUserToken<Guid>> builder) => builder.ToTable("user_tokens");
}
