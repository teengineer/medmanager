using FastEndpoints;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MedManager.Api.Features.Me.Delete;

public class DeleteMeEndpoint(AppDbContext db, ICurrentUser current, IHostEnvironment env)
    : EndpointWithoutRequest
{
    public override void Configure()
    {
        Delete("/me");
        Description(b => b.WithName("DeleteMe").WithTags("me"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == current.Id, ct);
        if (user is null)
        {
            await SendNoContentAsync(ct);
            return;
        }

        db.Users.Remove(user);
        await db.SaveChangesAsync(ct);

        HttpContext.Response.Cookies.Append(
            CookieDefaults.RefreshCookieName,
            "",
            CookieDefaults.Expired(env));

        await SendNoContentAsync(ct);
    }
}
