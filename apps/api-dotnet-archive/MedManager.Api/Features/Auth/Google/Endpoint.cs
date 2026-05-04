using System.Net.Http.Json;
using System.Text.Json.Serialization;
using FastEndpoints;
using FluentValidation;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using MedManager.Api.Domain;
using MedManager.Api.Features.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace MedManager.Api.Features.Auth.Google;

public record GoogleAuthRequest(string AccessToken);

public class GoogleAuthValidator : Validator<GoogleAuthRequest>
{
    public GoogleAuthValidator()
    {
        RuleFor(x => x.AccessToken).NotEmpty();
    }
}

public class GoogleUserInfo
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = "";

    [JsonPropertyName("email")]
    public string Email { get; set; } = "";

    [JsonPropertyName("verified_email")]
    public bool? VerifiedEmail { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("picture")]
    public string? Picture { get; set; }
}

public class GoogleAuthEndpoint(
    AppDbContext db,
    ITokenService tokens,
    IOptions<JwtOptions> jwt,
    IHostEnvironment env,
    IHttpClientFactory httpClients)
    : Endpoint<GoogleAuthRequest, AuthResponse>
{
    public override void Configure()
    {
        Post("/auth/google");
        AllowAnonymous();
        Description(b => b.WithName("GoogleAuth").WithTags("auth"));
    }

    public override async Task HandleAsync(GoogleAuthRequest req, CancellationToken ct)
    {
        var info = await ValidateAsync(req.AccessToken, ct);
        if (info is null || string.IsNullOrWhiteSpace(info.Email))
        {
            await SendAsync(default!, 401, ct);
            return;
        }

        var email = info.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null)
        {
            var (first, last) = SplitName(info.Name);
            user = new User
            {
                Email = email,
                PasswordHash = "",
                Locale = "tr",
                FirstName = first,
                LastName = last,
            };
            db.Users.Add(user);
            await db.SaveChangesAsync(ct);
        }
        else if (user.FirstName is null && info.Name is not null)
        {
            var (first, last) = SplitName(info.Name);
            user.FirstName = first;
            user.LastName = last;
            await db.SaveChangesAsync(ct);
        }

        var access = tokens.CreateAccessToken(user);
        var (refreshPlain, refreshEntity) = await tokens.IssueRefreshTokenAsync(user, ct);
        HttpContext.Response.Cookies.Append(
            CookieDefaults.RefreshCookieName,
            refreshPlain,
            CookieDefaults.Build(refreshEntity.ExpiresAt, env));

        await SendAsync(
            new AuthResponse(
                access,
                jwt.Value.AccessTokenMinutes * 60,
                MeDto.From(user)),
            cancellation: ct);
    }

    private static (string? First, string? Last) SplitName(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName)) return (null, null);
        var parts = fullName.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        return parts.Length switch
        {
            0 => (null, null),
            1 => (parts[0], null),
            _ => (parts[0], parts[1]),
        };
    }

    private async Task<GoogleUserInfo?> ValidateAsync(string accessToken, CancellationToken ct)
    {
        try
        {
            var client = httpClients.CreateClient("google");
            var response = await client.GetAsync(
                $"https://www.googleapis.com/oauth2/v1/userinfo?access_token={Uri.EscapeDataString(accessToken)}",
                ct);
            if (!response.IsSuccessStatusCode) return null;
            return await response.Content.ReadFromJsonAsync<GoogleUserInfo>(cancellationToken: ct);
        }
        catch
        {
            return null;
        }
    }
}
