namespace MedManager.Api.Domain;

public class Medicine
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public required string Name { get; set; }
    public string? ActiveIngredient { get; set; }
    public string? Strength { get; set; }
    public string? Form { get; set; }
    public string? Barcode { get; set; }
    public DateOnly ExpiryDate { get; set; }
    public DateOnly? OpenedAt { get; set; }
    public int? OpenedShelfLifeDays { get; set; }
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = "unit";
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public List<MedicineUseCase> UseCases { get; set; } = [];

    public DateOnly EffectiveExpiry
    {
        get
        {
            if (OpenedAt is null || OpenedShelfLifeDays is null) return ExpiryDate;
            var openedBased = OpenedAt.Value.AddDays(OpenedShelfLifeDays.Value);
            return openedBased < ExpiryDate ? openedBased : ExpiryDate;
        }
    }
}
