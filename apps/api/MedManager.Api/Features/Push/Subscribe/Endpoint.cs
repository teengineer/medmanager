using FastEndpoints;
using FluentValidation;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using MedManager.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace MedManager.Api.Features.Push.Subscribe;

public record SubscribeRequest(string Endpoint, string P256dh, string Auth);

public class SubscribeValidator : Validator<SubscribeRequest>
{
    public SubscribeValidator()
    {
        RuleFor(x => x.Endpoint).NotEmpty().MaximumLength(1024);
        RuleFor(x => x.P256dh).NotEmpty().MaximumLength(256);
        RuleFor(x => x.Auth).NotEmpty().MaximumLength(128);
    }
}

public class SubscribeEndpoint(AppDbContext db, ICurrentUser current) : Endpoint<SubscribeRequest>
{
    public override void Configure()
    {
        Post("/me/push-subscriptions");
        Description(b => b.WithName("PushSubscribe").WithTags("push"));
    }

    public override async Task HandleAsync(SubscribeRequest req, CancellationToken ct)
    {
        var existing = await db.PushSubscriptions
            .FirstOrDefaultAsync(x => x.Endpoint == req.Endpoint, ct);

        if (existing is null)
        {
            db.PushSubscriptions.Add(new PushSubscriptionEntity
            {
                UserId = current.Id,
                Endpoint = req.Endpoint,
                P256dh = req.P256dh,
                Auth = req.Auth,
            });
        }
        else if (existing.UserId != current.Id)
        {
            existing.UserId = current.Id;
            existing.P256dh = req.P256dh;
            existing.Auth = req.Auth;
        }

        await db.SaveChangesAsync(ct);
        await SendNoContentAsync(ct);
    }
}
