using MedManager.Api.Domain;

namespace MedManager.Api.Features.Medicines;

public record UseCaseTagDto(Guid Id, string Slug, string Name);

public record MedicineDto(
    Guid Id,
    string Name,
    string? ActiveIngredient,
    string? Strength,
    string? Form,
    string? Barcode,
    DateOnly ExpiryDate,
    DateOnly? OpenedAt,
    int? OpenedShelfLifeDays,
    DateOnly EffectiveExpiry,
    int DaysUntilExpiry,
    bool IsExpired,
    bool IsOpened,
    decimal Quantity,
    string Unit,
    string? Notes,
    IReadOnlyList<UseCaseTagDto> UseCases);

public static class MedicineMapper
{
    public static MedicineDto ToDto(Medicine m, string locale)
    {
        var effective = m.EffectiveExpiry;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var days = effective.DayNumber - today.DayNumber;
        var tags = m.UseCases
            .Select(x => new UseCaseTagDto(
                x.UseCaseId,
                x.UseCase.Slug,
                locale == "en" ? x.UseCase.NameEn : x.UseCase.NameTr))
            .ToList();

        return new MedicineDto(
            m.Id,
            m.Name,
            m.ActiveIngredient,
            m.Strength,
            m.Form,
            m.Barcode,
            m.ExpiryDate,
            m.OpenedAt,
            m.OpenedShelfLifeDays,
            effective,
            days,
            days < 0,
            m.OpenedAt is not null,
            m.Quantity,
            m.Unit,
            m.Notes,
            tags);
    }
}
