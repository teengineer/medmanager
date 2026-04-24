using FastEndpoints;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using MedManager.Api.Features.Medicines;
using Microsoft.EntityFrameworkCore;

namespace MedManager.Api.Features.UseCases.List;

public record UseCaseDto(Guid Id, string Slug, string Name, string? Icd10Code);

public class ListUseCasesEndpoint(AppDbContext db, ICurrentUser current)
    : EndpointWithoutRequest<IReadOnlyList<UseCaseDto>>
{
    public override void Configure()
    {
        Get("/use-cases");
        AllowAnonymous();
        Description(b => b.WithName("ListUseCases").WithTags("use-cases"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var locale = await LocaleHelper.ResolveAsync(HttpContext, db, current, ct);
        var userId = current.IsAuthenticated ? current.Id : (Guid?)null;

        var items = await db.UseCases
            .Where(u => u.UserId == null || u.UserId == userId)
            .OrderBy(u => locale == "en" ? u.NameEn : u.NameTr)
            .Select(u => new UseCaseDto(
                u.Id,
                u.Slug,
                locale == "en" ? u.NameEn : u.NameTr,
                u.Icd10Code))
            .ToListAsync(ct);
        await SendAsync(items, cancellation: ct);
    }
}
