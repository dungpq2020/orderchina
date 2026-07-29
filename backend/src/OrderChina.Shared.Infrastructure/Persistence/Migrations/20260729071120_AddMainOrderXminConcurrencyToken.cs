using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderChina.Shared.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMainOrderXminConcurrencyToken : Migration
    {
        // Cố ý để trống: "xmin" là cột hệ thống có sẵn trên MỌI bảng Postgres, không phải cột do EF tạo.
        // Model chỉ khai báo shadow property ánh xạ tới nó để dùng làm concurrency token (xem
        // MainOrderConfiguration.UseXminAsConcurrencyToken()) — EF Core Tools vẫn generate AddColumn/DropColumn
        // "xmin" tự động vì không tự biết đây là cột hệ thống, nhưng chạy thật sẽ lỗi "column name xmin
        // conflicts with a system column name". Migration này giữ lại chỉ để model snapshot khớp, Up/Down bỏ trống.

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
