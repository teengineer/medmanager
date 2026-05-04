using FastEndpoints;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MedManager.Api.Features.Medicines.List;

public record ListMedicinesRequest
{
    public string? Q { get; set; }
    public Guid? UseCase { get; set; }
    public bool? Expired { get; set; }
    public bool? Opened { get; set; }
}

public record ListMedicinesResponse(IReadOnlyList<MedicineDto> Items, int Total);

public class ListMedicinesEndpoint(AppDbContext db, ICurrentUser current)
    : Endpoint<ListMedicinesRequest, ListMedicinesResponse>
{
    public override void Configure()
    {
        Get("/medicines");
        Description(b => b.WithName("ListMedicines").WithTags("medicines"));
    }

    public override async Task HandleAsync(ListMedicinesRequest req, CancellationToken ct)
    {
        var locale = await LocaleHelper.ResolveAsync(HttpContext, db, current, ct);

        var query = db.Medicines
            .Where(m => m.UserId == current.Id)
            .Include(m => m.UseCases).ThenInclude(u => u.UseCase)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(req.Q))
        {
            var q = req.Q.Trim().ToLower();
            query = query.Where(m =>
                m.Name.ToLower().Contains(q)
                || (m.ActiveIngredient != null && m.ActiveIngredient.ToLower().Contains(q)));
        }
        if (req.UseCase is { } uc)
        {
            query = query.Where(m => m.UseCases.Any(x => x.UseCaseId == uc));
        }
        if (req.Opened is true) query = query.Where(m => m.OpenedAt != null);
        if (req.Opened is false) query = query.Where(m => m.OpenedAt == null);

        var medicines = await query.OrderBy(m => m.ExpiryDate).ToListAsync(ct);

        var dtos = medicines.Select(m => MedicineMapper.ToDto(m, locale)).ToList();

        if (req.Expired is true) dtos = dtos.Where(d => d.IsExpired).ToList();
        if (req.Expired is false) dtos = dtos.Where(d => !d.IsExpired).ToList();

        await SendAsync(new ListMedicinesResponse(dtos, dtos.Count), cancellation: ct);
    }
}
