using FastEndpoints;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MedManager.Api.Features.Push.Unsubscribe;

public record UnsubscribeRequest(string Endpoint);

public class UnsubscribeEndpoint(AppDbContext db, ICurrentUser current) : Endpoint<UnsubscribeRequest>
{
    public override void Configure()
    {
        Delete("/me/push-subscriptions");
        Description(b => b.WithName("PushUnsubscribe").WithTags("push"));
    }

    public override async Task HandleAsync(UnsubscribeRequest req, CancellationToken ct)
    {
        await db.PushSubscriptions
            .Where(x => x.Endpoint == req.Endpoint && x.UserId == current.Id)
            .ExecuteDeleteAsync(ct);
        await SendNoContentAsync(ct);
    }
}
