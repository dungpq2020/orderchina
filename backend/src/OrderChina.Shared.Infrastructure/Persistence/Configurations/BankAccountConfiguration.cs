using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Fees;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class BankAccountConfiguration : IEntityTypeConfiguration<BankAccount>
{
    public void Configure(EntityTypeBuilder<BankAccount> builder)
    {
        builder.ToTable("bank_accounts");

        builder.Property(b => b.BankName).HasMaxLength(256).IsRequired();
        builder.Property(b => b.AccountNumber).HasMaxLength(64).IsRequired();
        builder.Property(b => b.AccountHolderName).HasMaxLength(256).IsRequired();
        builder.Property(b => b.Branch).HasMaxLength(256);
        builder.Property(b => b.QrCodeUrl).HasMaxLength(1000);
    }
}
