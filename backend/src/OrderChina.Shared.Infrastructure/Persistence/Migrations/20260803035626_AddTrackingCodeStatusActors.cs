using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderChina.Shared.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTrackingCodeStatusActors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "arrived_china_warehouse_by_user_id",
                table: "tracking_codes",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "arrived_vietnam_warehouse_by_user_id",
                table: "tracking_codes",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "delivered_to_customer_by_user_id",
                table: "tracking_codes",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "in_transit_to_vietnam_by_user_id",
                table: "tracking_codes",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "arrived_china_warehouse_by_user_id",
                table: "tracking_codes");

            migrationBuilder.DropColumn(
                name: "arrived_vietnam_warehouse_by_user_id",
                table: "tracking_codes");

            migrationBuilder.DropColumn(
                name: "delivered_to_customer_by_user_id",
                table: "tracking_codes");

            migrationBuilder.DropColumn(
                name: "in_transit_to_vietnam_by_user_id",
                table: "tracking_codes");
        }
    }
}
