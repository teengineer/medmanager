using FastEndpoints;
using FluentValidation;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using MedManager.Api.Features.Auth;
using Microsoft.EntityFrameworkCore;

namespace MedManager.Api.Features.Me.Update;

public record UpdateMeRequest(string? Locale, string? TimeZone, string? FirstName, string? LastName);

public class UpdateMeValidator : Validator<UpdateMeRequest>
{
    public UpdateMeValidator()
    {
        When(x => x.Locale is not null, () =>
            RuleFor(x => x.Locale!).Must(l => l == "tr" || l == "en")
                .WithMessage("Locale must be 'tr' or 'en'."));
        When(x => x.TimeZone is not null, () =>
            RuleFor(x => x.TimeZone!).NotEmpty().MaximumLength(64));
        When(x => x.FirstName is not null, () =>
            RuleFor(x => x.FirstName!).MaximumLength(100));
        When(x => x.LastName is not null, () =>
            RuleFor(x => x.LastName!).MaximumLength(100));
    }
}

public class UpdateMeEndpoint(AppDbContext db, ICurrentUser current)
    : Endpoint<UpdateMeRequest, MeDto>
{
    public override void Configure()
    {
        Patch("/me");
        Description(b => b.WithName("UpdateMe").WithTags("me"));
    }

    public override async Task HandleAsync(UpdateMeRequest req, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == current.Id, ct);
        if (user is null)
        {
            await SendAsync(default!, 404, ct);
            return;
        }

        if (req.Locale is not null) user.Locale = req.Locale;
        if (req.TimeZone is not null) user.TimeZone = req.TimeZone;
        if (req.FirstName is not null)
            user.FirstName = string.IsNullOrWhiteSpace(req.FirstName) ? null : req.FirstName.Trim();
        if (req.LastName is not null)
            user.LastName = string.IsNullOrWhiteSpace(req.LastName) ? null : req.LastName.Trim();

        await db.SaveChangesAsync(ct);

        await SendAsync(MeDto.From(user), cancellation: ct);
    }
}
