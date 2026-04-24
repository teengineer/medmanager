using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MedManager.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class Phase5_CustomUseCases : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UseCases_Slug",
                table: "UseCases");

            migrationBuilder.AddColumn<Guid>(
                name: "UserId",
                table: "UseCases",
                type: "TEXT",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000001-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000002-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000003-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000004-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000005-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000006-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000007-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000008-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000009-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("0000000a-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("0000000b-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("0000000c-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("0000000d-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("0000000e-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("0000000f-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000010-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000011-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000012-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000013-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000014-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000015-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000016-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000017-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000018-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000019-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("0000001a-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("0000001b-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("0000001c-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("0000001d-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("0000001e-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("0000001f-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000020-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000021-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000022-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000023-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000024-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000025-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000026-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000027-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000028-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000029-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("0000002a-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("0000002b-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("0000002c-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("0000002d-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("0000002e-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("0000002f-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000030-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000031-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.UpdateData(
                table: "UseCases",
                keyColumn: "Id",
                keyValue: new Guid("00000032-0000-0000-0000-000000000000"),
                column: "UserId",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_UseCases_Slug_UserId",
                table: "UseCases",
                columns: new[] { "Slug", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_UseCases_UserId",
                table: "UseCases",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_UseCases_Users_UserId",
                table: "UseCases",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UseCases_Users_UserId",
                table: "UseCases");

            migrationBuilder.DropIndex(
                name: "IX_UseCases_Slug_UserId",
                table: "UseCases");

            migrationBuilder.DropIndex(
                name: "IX_UseCases_UserId",
                table: "UseCases");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "UseCases");

            migrationBuilder.CreateIndex(
                name: "IX_UseCases_Slug",
                table: "UseCases",
                column: "Slug",
                unique: true);
        }
    }
}
