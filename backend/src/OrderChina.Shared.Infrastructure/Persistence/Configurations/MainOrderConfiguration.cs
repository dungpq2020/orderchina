using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Orders;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class MainOrderConfiguration : IEntityTypeConfiguration<MainOrder>
{
    public void Configure(EntityTypeBuilder<MainOrder> builder)
    {
        builder.ToTable("main_orders");

        builder.Property(o => o.OrderNumber).UseIdentityAlwaysColumn();
        builder.Property(o => o.OrderCode).HasMaxLength(32).IsRequired();
        builder.Property(o => o.OrderType).HasConversion<int>().IsRequired();
        builder.Property(o => o.CreationType).HasConversion<int>().IsRequired();
        builder.Property(o => o.Status).HasConversion<int>().IsRequired();
        builder.Property(o => o.Note).HasMaxLength(1000);

        builder.HasIndex(o => o.OrderNumber).IsUnique();
        builder.HasIndex(o => o.OrderCode).IsUnique();
        builder.HasIndex(o => o.UserId);

        builder.HasMany(o => o.Products)
            .WithOne()
            .HasForeignKey(p => p.MainOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Dùng cột hệ thống "xmin" của Postgres làm concurrency token — không cần thêm cột/migration.
        // Chặn "lost update": staff mở trang chi tiết với dữ liệu cũ trong lúc khách vừa đặt cọc/đổi
        // trạng thái (hoặc bất kỳ thông tin nào khác của đơn), staff bấm Cập nhật sẽ bị từ chối
        // (DbUpdateConcurrencyException) thay vì ghi đè im lặng. Dùng UseXminAsConcurrencyToken() thay vì
        // Property<uint>("xmin").IsRowVersion() vì cách sau khiến EF hiểu nhầm là cột user thật, sinh migration
        // AddColumn "xmin" — trùng tên cột hệ thống, Postgres sẽ từ chối khi chạy migration.
#pragma warning disable CS0618
        builder.UseXminAsConcurrencyToken();
#pragma warning restore CS0618
    }
}
