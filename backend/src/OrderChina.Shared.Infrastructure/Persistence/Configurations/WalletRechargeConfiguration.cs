using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Wallets;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class WalletRechargeConfiguration : IEntityTypeConfiguration<WalletRecharge>
{
    public void Configure(EntityTypeBuilder<WalletRecharge> builder)
    {
        builder.ToTable("wallet_recharges");

        builder.Property(r => r.Note).HasMaxLength(500);
        builder.Property(r => r.Status).HasConversion<int>().IsRequired();

        builder.HasIndex(r => r.UserId);
    }
}
