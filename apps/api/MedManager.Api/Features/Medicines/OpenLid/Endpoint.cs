using FastEndpoints;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using MedManager.Api.Features.Medicines;
using Microsoft.EntityFrameworkCore;

namespace MedManager.Api.Features.Medicines.OpenLid;

public record OpenLidRequest(Guid Id, int? OpenedShelfLifeDays);

public class OpenLidEndpoint(AppDbContext db, ICurrentUser current)
    : Endpoint<OpenLidRequest, MedicineDto>
{
    public override void Configure()
    {
        Post("/medicines/{Id}/open");
        Description(b => b.WithName("OpenMedicine").WithTags("medicines"));
    }

    public override async Task HandleAsync(OpenLidRequest req, CancellationToken ct)
    {
        var medicine = await db.Medicines
            .Include(m => m.UseCases).ThenInclude(u => u.UseCase)
            .FirstOrDefaultAsync(m => m.Id == req.Id && m.UserId == current.Id, ct);

        if (medicine is null)
        {
            await SendAsync(default!, 404, ct);
            return;
        }

        medicine.OpenedAt ??= DateOnly.FromDateTime(DateTime.UtcNow);
        if (req.OpenedShelfLifeDays is not null)
            medicine.OpenedShelfLifeDays = req.OpenedShelfLifeDays;

        await db.SaveChangesAsync(ct);

        var locale = await LocaleHelper.ResolveAsync(HttpContext, db, current, ct);
        await SendAsync(MedicineMapper.ToDto(medicine, locale), cancellation: ct);
    }
}
