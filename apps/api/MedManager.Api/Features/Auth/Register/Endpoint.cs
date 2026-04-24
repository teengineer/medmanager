using FastEndpoints;
using FluentValidation;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using MedManager.Api.Domain;
using MedManager.Api.Features.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace MedManager.Api.Features.Auth.Register;

public record RegisterRequest(
    string Email,
    string Password,
    string Locale,
    string? FirstName,
    string? LastName);

public class RegisterValidator : Validator<RegisterRequest>
{
    public RegisterValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(320);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).MaximumLength(200);
        RuleFor(x => x.Locale).NotEmpty().Must(l => l == "tr" || l == "en")
            .WithMessage("Locale must be 'tr' or 'en'.");
        When(x => x.FirstName is not null, () =>
            RuleFor(x => x.FirstName!).MaximumLength(100));
        When(x => x.LastName is not null, () =>
            RuleFor(x => x.LastName!).MaximumLength(100));
    }
}

public class RegisterEndpoint(
    AppDbContext db,
    IPasswordHasher hasher,
    ITokenService tokens,
    IOptions<JwtOptions> jwt,
    IHostEnvironment env)
    : Endpoint<RegisterRequest, AuthResponse>
{
    public override void Configure()
    {
        Post("/auth/register");
        AllowAnonymous();
        Description(b => b.WithName("Register").WithTags("auth"));
    }

    public override async Task HandleAsync(RegisterRequest req, CancellationToken ct)
    {
        var normalizedEmail = req.Email.Trim().ToLowerInvariant();

        var exists = await db.Users.AnyAsync(u => u.Email == normalizedEmail, ct);
        if (exists)
        {
            AddError(r => r.Email, "Email already registered.");
            await SendErrorsAsync(409, ct);
            return;
        }

        var user = new User
        {
            Email = normalizedEmail,
            PasswordHash = hasher.Hash(req.Password),
            Locale = req.Locale,
            FirstName = string.IsNullOrWhiteSpace(req.FirstName) ? null : req.FirstName.Trim(),
            LastName = string.IsNullOrWhiteSpace(req.LastName) ? null : req.LastName.Trim(),
        };
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

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
}
