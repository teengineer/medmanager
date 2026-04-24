using MedManager.Api.Auth;
using MedManager.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MedManager.Api.Features.Medicines;

public static class LocaleHelper
{
    public static async Task<string> ResolveAsync(HttpContext ctx, AppDbContext db, ICurrentUser current, CancellationToken token)
    {
        if (current.IsAuthenticated)
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == current.Id, token);
            if (user is not null) return user.Locale;
        }

        if (ctx.Request.Headers.TryGetValue("Accept-Language", out var al))
        {
            var first = al.ToString().Split(',', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.Trim();
            if (first?.StartsWith("en", StringComparison.OrdinalIgnoreCase) == true) return "en";
            if (first?.StartsWith("tr", StringComparison.OrdinalIgnoreCase) == true) return "tr";
        }

        return "tr";
    }
}
