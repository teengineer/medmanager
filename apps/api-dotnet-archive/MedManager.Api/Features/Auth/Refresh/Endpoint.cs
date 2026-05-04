using FastEndpoints;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using MedManager.Api.Features.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace MedManager.Api.Features.Auth.Refresh;

public class RefreshEndpoint(
    AppDbContext db,
    ITokenService tokens,
    IOptions<JwtOptions> jwt,
    IHostEnvironment env)
    : EndpointWithoutRequest<AuthResponse>
{
    public override void Configure()
    {
        Post("/auth/refresh");
        AllowAnonymous();
        Description(b => b.WithName("Refresh").WithTags("auth"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        if (!HttpContext.Request.Cookies.TryGetValue(CookieDefaults.RefreshCookieName, out var plain)
            || string.IsNullOrWhiteSpace(plain))
        {
            await SendAsync(default!, 401, ct);
            return;
        }

        var existing = await tokens.FindActiveRefreshTokenAsync(plain, ct);
        if (existing is null)
        {
            HttpContext.Response.Cookies.Append(
                CookieDefaults.RefreshCookieName,
                "",
                CookieDefaults.Expired(env));
            await SendAsync(default!, 401, ct);
            return;
        }

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == existing.UserId, ct);
        if (user is null)
        {
            await SendAsync(default!, 401, ct);
            return;
        }

        await tokens.RevokeAsync(existing, ct);

        var access = tokens.CreateAccessToken(user);
        var (newPlain, newEntity) = await tokens.IssueRefreshTokenAsync(user, ct);
        HttpContext.Response.Cookies.Append(
            CookieDefaults.RefreshCookieName,
            newPlain,
            CookieDefaults.Build(newEntity.ExpiresAt, env));

        await SendAsync(
            new AuthResponse(
                access,
                jwt.Value.AccessTokenMinutes * 60,
                MeDto.From(user)),
            cancellation: ct);
    }
}
