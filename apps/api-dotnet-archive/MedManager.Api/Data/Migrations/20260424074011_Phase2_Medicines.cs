using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MedManager.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class Phase2_Medicines : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Medicines",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    ActiveIngredient = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    Strength = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    Form = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    Barcode = table.Column<string>(type: "TEXT", maxLength: 64, nullable: true),
                    ExpiryDate = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    OpenedAt = table.Column<DateOnly>(type: "TEXT", nullable: true),
                    OpenedShelfLifeDays = table.Column<int>(type: "INTEGER", nullable: true),
                    Quantity = table.Column<decimal>(type: "TEXT", precision: 10, scale: 2, nullable: false),
                    Unit = table.Column<string>(type: "TEXT", maxLength: 32, nullable: false),
                    Notes = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Medicines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Medicines_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UseCases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Slug = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    NameTr = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    NameEn = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Icd10Code = table.Column<string>(type: "TEXT", maxLength: 10, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UseCases", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MedicineUseCases",
                columns: table => new
                {
                    MedicineId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UseCaseId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MedicineUseCases", x => new { x.MedicineId, x.UseCaseId });
                    table.ForeignKey(
                        name: "FK_MedicineUseCases_Medicines_MedicineId",
                        column: x => x.MedicineId,
                        principalTable: "Medicines",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MedicineUseCases_UseCases_UseCaseId",
                        column: x => x.UseCaseId,
                        principalTable: "UseCases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "UseCases",
                columns: new[] { "Id", "Icd10Code", "NameEn", "NameTr", "Slug" },
                values: new object[,]
                {
                    { new Guid("00000001-0000-0000-0000-000000000000"), "R51", "Headache", "Baş ağrısı", "headache" },
                    { new Guid("00000002-0000-0000-0000-000000000000"), "G43", "Migraine", "Migren", "migraine" },
                    { new Guid("00000003-0000-0000-0000-000000000000"), "R50", "Fever", "Ateş", "fever" },
                    { new Guid("00000004-0000-0000-0000-000000000000"), "J02", "Sore throat", "Boğaz ağrısı", "sore-throat" },
                    { new Guid("00000005-0000-0000-0000-000000000000"), "J00", "Common cold", "Nezle", "common-cold" },
                    { new Guid("00000006-0000-0000-0000-000000000000"), "J11", "Flu", "Grip", "flu" },
                    { new Guid("00000007-0000-0000-0000-000000000000"), "R05", "Cough", "Öksürük", "cough" },
                    { new Guid("00000008-0000-0000-0000-000000000000"), "J34", "Runny nose", "Burun akıntısı", "runny-nose" },
                    { new Guid("00000009-0000-0000-0000-000000000000"), "R09", "Nasal congestion", "Burun tıkanıklığı", "nasal-congestion" },
                    { new Guid("0000000a-0000-0000-0000-000000000000"), "J32", "Sinusitis", "Sinüzit", "sinusitis" },
                    { new Guid("0000000b-0000-0000-0000-000000000000"), "H66", "Ear infection", "Kulak iltihabı", "otitis" },
                    { new Guid("0000000c-0000-0000-0000-000000000000"), "R11", "Nausea", "Mide bulantısı", "nausea" },
                    { new Guid("0000000d-0000-0000-0000-000000000000"), "R11", "Vomiting", "Kusma", "vomiting" },
                    { new Guid("0000000e-0000-0000-0000-000000000000"), "K52", "Diarrhea", "İshal", "diarrhea" },
                    { new Guid("0000000f-0000-0000-0000-000000000000"), "K59", "Constipation", "Kabızlık", "constipation" },
                    { new Guid("00000010-0000-0000-0000-000000000000"), "R10", "Stomach pain", "Mide ağrısı", "stomach-pain" },
                    { new Guid("00000011-0000-0000-0000-000000000000"), "K30", "Indigestion", "Hazımsızlık", "indigestion" },
                    { new Guid("00000012-0000-0000-0000-000000000000"), "R12", "Heartburn", "Mide ekşimesi", "heartburn" },
                    { new Guid("00000013-0000-0000-0000-000000000000"), "K29", "Gastritis", "Gastrit", "gastritis" },
                    { new Guid("00000014-0000-0000-0000-000000000000"), "K21", "Reflux", "Reflü", "reflux" },
                    { new Guid("00000015-0000-0000-0000-000000000000"), "T78", "Allergy", "Alerji", "allergy" },
                    { new Guid("00000016-0000-0000-0000-000000000000"), "J30", "Hay fever", "Saman nezlesi", "hay-fever" },
                    { new Guid("00000017-0000-0000-0000-000000000000"), "J45", "Asthma", "Astım", "asthma" },
                    { new Guid("00000018-0000-0000-0000-000000000000"), "R21", "Skin rash", "Cilt döküntüsü", "skin-rash" },
                    { new Guid("00000019-0000-0000-0000-000000000000"), "L29", "Itching", "Kaşıntı", "itching" },
                    { new Guid("0000001a-0000-0000-0000-000000000000"), "L30", "Eczema", "Egzama", "eczema" },
                    { new Guid("0000001b-0000-0000-0000-000000000000"), "L70", "Acne", "Akne", "acne" },
                    { new Guid("0000001c-0000-0000-0000-000000000000"), "B35", "Fungal infection", "Mantar enfeksiyonu", "fungal-infection" },
                    { new Guid("0000001d-0000-0000-0000-000000000000"), null, "Wound care", "Yara bakımı", "wound-care" },
                    { new Guid("0000001e-0000-0000-0000-000000000000"), "T14", "Insect bite", "Böcek ısırığı", "insect-bite" },
                    { new Guid("0000001f-0000-0000-0000-000000000000"), "L55", "Sunburn", "Güneş yanığı", "sunburn" },
                    { new Guid("00000020-0000-0000-0000-000000000000"), "M54", "Back pain", "Bel ağrısı", "back-pain" },
                    { new Guid("00000021-0000-0000-0000-000000000000"), "M79", "Muscle pain", "Kas ağrısı", "muscle-pain" },
                    { new Guid("00000022-0000-0000-0000-000000000000"), "M25", "Joint pain", "Eklem ağrısı", "joint-pain" },
                    { new Guid("00000023-0000-0000-0000-000000000000"), "M19", "Arthritis", "Artrit", "arthritis" },
                    { new Guid("00000024-0000-0000-0000-000000000000"), "N94", "Menstrual pain", "Adet ağrısı", "menstrual-pain" },
                    { new Guid("00000025-0000-0000-0000-000000000000"), "G47", "Insomnia", "Uykusuzluk", "insomnia" },
                    { new Guid("00000026-0000-0000-0000-000000000000"), "F41", "Anxiety", "Anksiyete", "anxiety" },
                    { new Guid("00000027-0000-0000-0000-000000000000"), "I10", "Hypertension", "Yüksek tansiyon", "hypertension" },
                    { new Guid("00000028-0000-0000-0000-000000000000"), "I95", "Low blood pressure", "Düşük tansiyon", "hypotension" },
                    { new Guid("00000029-0000-0000-0000-000000000000"), "E11", "Diabetes", "Diyabet", "diabetes" },
                    { new Guid("0000002a-0000-0000-0000-000000000000"), "E78", "High cholesterol", "Yüksek kolesterol", "high-cholesterol" },
                    { new Guid("0000002b-0000-0000-0000-000000000000"), "H04", "Dry eyes", "Göz kuruluğu", "dry-eyes" },
                    { new Guid("0000002c-0000-0000-0000-000000000000"), "H10", "Conjunctivitis", "Konjonktivit", "conjunctivitis" },
                    { new Guid("0000002d-0000-0000-0000-000000000000"), "K08", "Toothache", "Diş ağrısı", "toothache" },
                    { new Guid("0000002e-0000-0000-0000-000000000000"), "K12", "Mouth ulcer", "Ağız içi yarası", "mouth-ulcer" },
                    { new Guid("0000002f-0000-0000-0000-000000000000"), "N39", "Urinary tract infection", "İdrar yolu enfeksiyonu", "urinary-tract" },
                    { new Guid("00000030-0000-0000-0000-000000000000"), "E56", "Vitamin deficiency", "Vitamin eksikliği", "vitamin-deficiency" },
                    { new Guid("00000031-0000-0000-0000-000000000000"), "D64", "Anemia", "Anemi", "anemia" },
                    { new Guid("00000032-0000-0000-0000-000000000000"), "T75", "Motion sickness", "Taşıt tutması", "motion-sickness" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_MedicineUseCases_UseCaseId",
                table: "MedicineUseCases",
                column: "UseCaseId");

            migrationBuilder.CreateIndex(
                name: "IX_Medicines_UserId",
                table: "Medicines",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Medicines_UserId_ExpiryDate",
                table: "Medicines",
                columns: new[] { "UserId", "ExpiryDate" });

            migrationBuilder.CreateIndex(
                name: "IX_UseCases_Slug",
                table: "UseCases",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MedicineUseCases");

            migrationBuilder.DropTable(
                name: "Medicines");

            migrationBuilder.DropTable(
                name: "UseCases");
        }
    }
}
