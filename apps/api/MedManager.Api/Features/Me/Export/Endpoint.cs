using System.Text.Json;
using FastEndpoints;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using MedManager.Api.Features.Medicines;
using Microsoft.EntityFrameworkCore;

namespace MedManager.Api.Features.Me.Export;

public class ExportMeEndpoint(AppDbContext db, ICurrentUser current) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Post("/me/export");
        Description(b => b.WithName("ExportMe").WithTags("me"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == current.Id, ct);
        if (user is null)
        {
            await SendAsync(default!, 404, ct);
            return;
        }

        var medicines = await db.Medicines
            .Where(m => m.UserId == current.Id)
            .Include(m => m.UseCases).ThenInclude(u => u.UseCase)
            .ToListAsync(ct);

        var locale = user.Locale;
        var payload = new
        {
            exportedAt = DateTime.UtcNow,
            user = new { user.Id, user.Email, user.Locale, user.TimeZone, user.CreatedAt },
            medicines = medicines.Select(m => MedicineMapper.ToDto(m, locale)),
        };

        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions
        {
            WriteIndented = true,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
        });

        HttpContext.Response.Headers.Append(
            "Content-Disposition",
            $"attachment; filename=\"medmanager-export-{DateTime.UtcNow:yyyyMMdd-HHmmss}.json\"");
        HttpContext.Response.ContentType = "application/json";
        await HttpContext.Response.WriteAsync(json, ct);
    }
}
