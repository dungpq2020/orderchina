using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderChina.Shared.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTrackingCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tracking_codes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    main_order_id = table.Column<Guid>(type: "uuid", nullable: true),
                    transport_order_id = table.Column<Guid>(type: "uuid", nullable: true),
                    code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    weight_kg = table.Column<decimal>(type: "numeric", nullable: false),
                    length_cm = table.Column<decimal>(type: "numeric", nullable: false),
                    width_cm = table.Column<decimal>(type: "numeric", nullable: false),
                    height_cm = table.Column<decimal>(type: "numeric", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_tracking_codes", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_tracking_codes_main_order_id",
                table: "tracking_codes",
                column: "main_order_id");

            migrationBuilder.CreateIndex(
                name: "ix_tracking_codes_transport_order_id",
                table: "tracking_codes",
                column: "transport_order_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tracking_codes");
        }
    }
}
