using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderChina.Shared.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWalletRechargeStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "approved_at_utc",
                table: "wallet_recharges",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "approved_by_user_id",
                table: "wallet_recharges",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "status",
                table: "wallet_recharges",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            // Dữ liệu cũ (trước migration này) đều được tạo theo luồng cộng tiền ngay — coi như đã
            // duyệt ngay tại thời điểm tạo, không phải giá trị mặc định giả.
            migrationBuilder.Sql(
                "UPDATE wallet_recharges SET approved_at_utc = created_at_utc, approved_by_user_id = created_by_user_id;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "approved_at_utc",
                table: "wallet_recharges");

            migrationBuilder.DropColumn(
                name: "approved_by_user_id",
                table: "wallet_recharges");

            migrationBuilder.DropColumn(
                name: "status",
                table: "wallet_recharges");
        }
    }
}
