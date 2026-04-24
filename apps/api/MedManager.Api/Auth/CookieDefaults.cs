using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;

namespace MedManager.Api.Auth;

public static class CookieDefaults
{
    public const string RefreshCookieName = "medmanager.rt";

    public static bool UseSecure(IHostEnvironment env) =>
        !env.IsDevelopment() && !env.IsEnvironment("Testing");

    public static CookieOptions Build(DateTime expiresAt, IHostEnvironment env) => new()
    {
        HttpOnly = true,
        Secure = UseSecure(env),
        SameSite = SameSiteMode.Lax,
        Expires = expiresAt,
        Path = "/",
        IsEssential = true,
    };

    public static CookieOptions Expired(IHostEnvironment env) => new()
    {
        HttpOnly = true,
        Secure = UseSecure(env),
        SameSite = SameSiteMode.Lax,
        Expires = DateTimeOffset.UnixEpoch,
        Path = "/",
        IsEssential = true,
    };
}
