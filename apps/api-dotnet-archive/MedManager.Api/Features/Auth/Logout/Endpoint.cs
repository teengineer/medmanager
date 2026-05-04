using FastEndpoints;
using MedManager.Api.Auth;

namespace MedManager.Api.Features.Auth.Logout;

public class LogoutEndpoint(ITokenService tokens, IHostEnvironment env) : EndpointWithoutRequest
{
    public override void Configure()
    {
        Post("/auth/logout");
        AllowAnonymous();
        Description(b => b.WithName("Logout").WithTags("auth"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        if (HttpContext.Request.Cookies.TryGetValue(CookieDefaults.RefreshCookieName, out var plain)
            && !string.IsNullOrWhiteSpace(plain))
        {
            var existing = await tokens.FindActiveRefreshTokenAsync(plain, ct);
            if (existing is not null)
                await tokens.RevokeAsync(existing, ct);
        }

        HttpContext.Response.Cookies.Append(
            CookieDefaults.RefreshCookieName,
            "",
            CookieDefaults.Expired(env));

        await SendNoContentAsync(ct);
    }
}
