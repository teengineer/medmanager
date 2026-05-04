using FastEndpoints;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using MedManager.Api.Features.Medicines;
using Microsoft.EntityFrameworkCore;

namespace MedManager.Api.Features.Search;

public record SearchRequest
{
    public Guid UseCase { get; set; }
}

public record SearchResponse(IReadOnlyList<MedicineDto> Items);

public class SearchEndpoint(AppDbContext db, ICurrentUser current)
    : Endpoint<SearchRequest, SearchResponse>
{
    public override void Configure()
    {
        Get("/search");
        Description(b => b.WithName("Search").WithTags("search"));
    }

    public override async Task HandleAsync(SearchRequest req, CancellationToken ct)
    {
        var locale = await LocaleHelper.ResolveAsync(HttpContext, db, current, ct);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var medicines = await db.Medicines
            .Where(m => m.UserId == current.Id
                        && m.Quantity > 0
                        && m.UseCases.Any(x => x.UseCaseId == req.UseCase))
            .Include(m => m.UseCases).ThenInclude(u => u.UseCase)
            .ToListAsync(ct);

        var valid = medicines
            .Select(m => MedicineMapper.ToDto(m, locale))
            .Where(d => d.EffectiveExpiry >= today)
            .OrderBy(d => d.EffectiveExpiry)
            .ToList();

        await SendAsync(new SearchResponse(valid), cancellation: ct);
    }
}
