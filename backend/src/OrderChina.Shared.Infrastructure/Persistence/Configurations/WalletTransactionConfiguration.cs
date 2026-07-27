using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Wallets;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class WalletTransactionConfiguration : IEntityTypeConfiguration<WalletTransaction>
{
    public void Configure(EntityTypeBuilder<WalletTransaction> builder)
    {
        builder.ToTable("wallet_transactions");

        builder.Property(t => t.Type).HasConversion<int>().IsRequired();
        builder.Property(t => t.Description).HasMaxLength(500);

        builder.HasIndex(t => t.UserId);
    }
}
