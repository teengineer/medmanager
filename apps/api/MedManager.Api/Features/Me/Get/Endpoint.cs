using FastEndpoints;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using MedManager.Api.Features.Auth;
using Microsoft.EntityFrameworkCore;

namespace MedManager.Api.Features.Me.Get;

public class GetMeEndpoint(AppDbContext db, ICurrentUser current) : EndpointWithoutRequest<MeDto>
{
    public override void Configure()
    {
        Get("/me");
        Description(b => b.WithName("GetMe").WithTags("me"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == current.Id, ct);
        if (user is null)
        {
            await SendAsync(default!, 404, ct);
            return;
        }
        await SendAsync(MeDto.From(user), cancellation: ct);
    }
}
