using FastEndpoints;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MedManager.Api.Features.Medicines.GetById;

public record GetMedicineRequest(Guid Id);

public class GetMedicineEndpoint(AppDbContext db, ICurrentUser current)
    : Endpoint<GetMedicineRequest, MedicineDto>
{
    public override void Configure()
    {
        Get("/medicines/{Id}");
        Description(b => b.WithName("GetMedicine").WithTags("medicines"));
    }

    public override async Task HandleAsync(GetMedicineRequest req, CancellationToken ct)
    {
        var medicine = await db.Medicines
            .Include(m => m.UseCases).ThenInclude(u => u.UseCase)
            .FirstOrDefaultAsync(m => m.Id == req.Id && m.UserId == current.Id, ct);

        if (medicine is null)
        {
            await SendAsync(default!, 404, ct);
            return;
        }
        var locale = await LocaleHelper.ResolveAsync(HttpContext, db, current, ct);
        await SendAsync(MedicineMapper.ToDto(medicine, locale), cancellation: ct);
    }
}
