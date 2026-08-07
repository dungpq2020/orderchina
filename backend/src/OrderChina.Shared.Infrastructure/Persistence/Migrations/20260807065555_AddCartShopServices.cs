using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderChina.Shared.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCartShopServices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "request_check_product",
                table: "order_shop_temps",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "request_home_delivery",
                table: "order_shop_temps",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "request_insurance",
                table: "order_shop_temps",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "request_packaging",
                table: "order_shop_temps",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "request_check_product",
                table: "order_shop_temps");

            migrationBuilder.DropColumn(
                name: "request_home_delivery",
                table: "order_shop_temps");

            migrationBuilder.DropColumn(
                name: "request_insurance",
                table: "order_shop_temps");

            migrationBuilder.DropColumn(
                name: "request_packaging",
                table: "order_shop_temps");
        }
    }
}
