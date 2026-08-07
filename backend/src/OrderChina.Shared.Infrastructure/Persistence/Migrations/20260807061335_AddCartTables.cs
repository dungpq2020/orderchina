using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderChina.Shared.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCartTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "order_shop_temps",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    shop_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    shop_link = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    platform = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_order_shop_temps", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "product_temps",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    order_shop_temp_id = table.Column<Guid>(type: "uuid", nullable: false),
                    image_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    product_link = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    product_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    attributes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    unit_price_cny = table.Column<decimal>(type: "numeric", nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_product_temps", x => x.id);
                    table.ForeignKey(
                        name: "fk_product_temps_order_shop_temps_order_shop_temp_id",
                        column: x => x.order_shop_temp_id,
                        principalTable: "order_shop_temps",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_order_shop_temps_user_id",
                table: "order_shop_temps",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_product_temps_order_shop_temp_id",
                table: "product_temps",
                column: "order_shop_temp_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "product_temps");

            migrationBuilder.DropTable(
                name: "order_shop_temps");
        }
    }
}
