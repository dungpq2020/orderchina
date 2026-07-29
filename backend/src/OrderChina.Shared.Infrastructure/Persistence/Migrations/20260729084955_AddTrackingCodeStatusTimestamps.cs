using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderChina.Shared.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTrackingCodeStatusTimestamps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "arrived_china_warehouse_at_utc",
                table: "tracking_codes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "arrived_vietnam_warehouse_at_utc",
                table: "tracking_codes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "delivered_to_customer_at_utc",
                table: "tracking_codes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "in_transit_to_vietnam_at_utc",
                table: "tracking_codes",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "arrived_china_warehouse_at_utc",
                table: "tracking_codes");

            migrationBuilder.DropColumn(
                name: "arrived_vietnam_warehouse_at_utc",
                table: "tracking_codes");

            migrationBuilder.DropColumn(
                name: "delivered_to_customer_at_utc",
                table: "tracking_codes");

            migrationBuilder.DropColumn(
                name: "in_transit_to_vietnam_at_utc",
                table: "tracking_codes");
        }
    }
}
