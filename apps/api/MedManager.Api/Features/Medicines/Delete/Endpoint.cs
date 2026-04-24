using FastEndpoints;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MedManager.Api.Features.Medicines.Delete;

public record DeleteMedicineRequest(Guid Id);

public class DeleteMedicineEndpoint(AppDbContext db, ICurrentUser current) : Endpoint<DeleteMedicineRequest>
{
    public override void Configure()
    {
        Delete("/medicines/{Id}");
        Description(b => b.WithName("DeleteMedicine").WithTags("medicines"));
    }

    public override async Task HandleAsync(DeleteMedicineRequest req, CancellationToken ct)
    {
        var medicine = await db.Medicines
            .FirstOrDefaultAsync(m => m.Id == req.Id && m.UserId == current.Id, ct);

        if (medicine is null)
        {
            await SendNoContentAsync(ct);
            return;
        }
        db.Medicines.Remove(medicine);
        await db.SaveChangesAsync(ct);
        await SendNoContentAsync(ct);
    }
}
