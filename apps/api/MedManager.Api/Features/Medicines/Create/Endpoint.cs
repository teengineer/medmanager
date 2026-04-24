using FastEndpoints;
using FluentValidation;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using MedManager.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace MedManager.Api.Features.Medicines.Create;

public record CreateMedicineRequest(
    string Name,
    string? ActiveIngredient,
    string? Strength,
    string? Form,
    string? Barcode,
    DateOnly ExpiryDate,
    DateOnly? OpenedAt,
    int? OpenedShelfLifeDays,
    decimal Quantity,
    string Unit,
    string? Notes,
    IReadOnlyList<Guid>? UseCaseIds);

public class CreateMedicineValidator : Validator<CreateMedicineRequest>
{
    public CreateMedicineValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Unit).NotEmpty().MaximumLength(32);
        RuleFor(x => x.Quantity).GreaterThanOrEqualTo(0);
        RuleFor(x => x.OpenedShelfLifeDays).GreaterThan(0).When(x => x.OpenedShelfLifeDays is not null);
    }
}

public class CreateMedicineEndpoint(AppDbContext db, ICurrentUser current)
    : Endpoint<CreateMedicineRequest, MedicineDto>
{
    public override void Configure()
    {
        Post("/medicines");
        Description(b => b.WithName("CreateMedicine").WithTags("medicines"));
    }

    public override async Task HandleAsync(CreateMedicineRequest req, CancellationToken ct)
    {
        var medicine = new Medicine
        {
            UserId = current.Id,
            Name = req.Name.Trim(),
            ActiveIngredient = req.ActiveIngredient?.Trim(),
            Strength = req.Strength?.Trim(),
            Form = req.Form?.Trim(),
            Barcode = req.Barcode?.Trim(),
            ExpiryDate = req.ExpiryDate,
            OpenedAt = req.OpenedAt,
            OpenedShelfLifeDays = req.OpenedShelfLifeDays,
            Quantity = req.Quantity,
            Unit = req.Unit.Trim(),
            Notes = req.Notes?.Trim(),
        };

        if (req.UseCaseIds is { Count: > 0 })
        {
            foreach (var id in req.UseCaseIds.Distinct())
                medicine.UseCases.Add(new MedicineUseCase { UseCaseId = id });
        }

        db.Medicines.Add(medicine);
        await db.SaveChangesAsync(ct);

        await db.Entry(medicine).Collection(m => m.UseCases).Query()
            .Include(u => u.UseCase).LoadAsync(ct);

        var locale = await LocaleHelper.ResolveAsync(HttpContext, db, current, ct);
        await SendAsync(MedicineMapper.ToDto(medicine, locale), 201, ct);
    }
}
