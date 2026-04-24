using FastEndpoints;
using FluentValidation;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using MedManager.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace MedManager.Api.Features.Medicines.Update;

public record UpdateMedicineRequest(
    Guid Id,
    string? Name,
    string? ActiveIngredient,
    string? Strength,
    string? Form,
    string? Barcode,
    DateOnly? ExpiryDate,
    DateOnly? OpenedAt,
    bool? ClearOpenedAt,
    int? OpenedShelfLifeDays,
    decimal? Quantity,
    string? Unit,
    string? Notes,
    IReadOnlyList<Guid>? UseCaseIds);

public class UpdateMedicineValidator : Validator<UpdateMedicineRequest>
{
    public UpdateMedicineValidator()
    {
        When(x => x.Name is not null, () => RuleFor(x => x.Name!).NotEmpty().MaximumLength(200));
        When(x => x.Unit is not null, () => RuleFor(x => x.Unit!).NotEmpty().MaximumLength(32));
        When(x => x.Quantity is not null, () => RuleFor(x => x.Quantity!.Value).GreaterThanOrEqualTo(0));
    }
}

public class UpdateMedicineEndpoint(AppDbContext db, ICurrentUser current)
    : Endpoint<UpdateMedicineRequest, MedicineDto>
{
    public override void Configure()
    {
        Patch("/medicines/{Id}");
        Description(b => b.WithName("UpdateMedicine").WithTags("medicines"));
    }

    public override async Task HandleAsync(UpdateMedicineRequest req, CancellationToken ct)
    {
        var medicine = await db.Medicines
            .Include(m => m.UseCases)
            .FirstOrDefaultAsync(m => m.Id == req.Id && m.UserId == current.Id, ct);

        if (medicine is null)
        {
            await SendAsync(default!, 404, ct);
            return;
        }

        if (req.Name is not null) medicine.Name = req.Name.Trim();
        if (req.ActiveIngredient is not null) medicine.ActiveIngredient = req.ActiveIngredient.Trim();
        if (req.Strength is not null) medicine.Strength = req.Strength.Trim();
        if (req.Form is not null) medicine.Form = req.Form.Trim();
        if (req.Barcode is not null) medicine.Barcode = req.Barcode.Trim();
        if (req.ExpiryDate is not null) medicine.ExpiryDate = req.ExpiryDate.Value;
        if (req.ClearOpenedAt == true) medicine.OpenedAt = null;
        else if (req.OpenedAt is not null) medicine.OpenedAt = req.OpenedAt;
        if (req.OpenedShelfLifeDays is not null) medicine.OpenedShelfLifeDays = req.OpenedShelfLifeDays;
        if (req.Quantity is not null) medicine.Quantity = req.Quantity.Value;
        if (req.Unit is not null) medicine.Unit = req.Unit.Trim();
        if (req.Notes is not null) medicine.Notes = req.Notes.Trim();

        if (req.UseCaseIds is not null)
        {
            medicine.UseCases.Clear();
            foreach (var id in req.UseCaseIds.Distinct())
                medicine.UseCases.Add(new MedicineUseCase { MedicineId = medicine.Id, UseCaseId = id });
        }

        await db.SaveChangesAsync(ct);
        await db.Entry(medicine).Collection(m => m.UseCases).Query()
            .Include(u => u.UseCase)
            .LoadAsync(ct);

        var locale = await LocaleHelper.ResolveAsync(HttpContext, db, current, ct);
        await SendAsync(MedicineMapper.ToDto(medicine, locale), cancellation: ct);
    }
}
