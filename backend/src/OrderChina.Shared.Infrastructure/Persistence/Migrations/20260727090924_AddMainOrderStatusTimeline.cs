using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderChina.Shared.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMainOrderStatusTimeline : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "arrived_china_warehouse_at_utc",
                table: "main_orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "arrived_vietnam_warehouse_at_utc",
                table: "main_orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "awaiting_deposit_at_utc",
                table: "main_orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "awaiting_shop_shipment_at_utc",
                table: "main_orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "cancelled_at_utc",
                table: "main_orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "complaint_at_utc",
                table: "main_orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "completed_at_utc",
                table: "main_orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "creation_type",
                table: "main_orders",
                type: "integer",
                nullable: false,
                defaultValue: 2); // MainOrderCreationType.Manual — mọi đơn hiện có đều tạo qua trang staff thủ công.

            migrationBuilder.AddColumn<DateTime>(
                name: "deposited_at_utc",
                table: "main_orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "in_transit_to_vietnam_at_utc",
                table: "main_orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "paid_at_utc",
                table: "main_orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "purchased_at_utc",
                table: "main_orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "shop_shipped_at_utc",
                table: "main_orders",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "arrived_china_warehouse_at_utc",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "arrived_vietnam_warehouse_at_utc",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "awaiting_deposit_at_utc",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "awaiting_shop_shipment_at_utc",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "cancelled_at_utc",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "complaint_at_utc",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "completed_at_utc",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "creation_type",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "deposited_at_utc",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "in_transit_to_vietnam_at_utc",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "paid_at_utc",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "purchased_at_utc",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "shop_shipped_at_utc",
                table: "main_orders");
        }
    }
}
