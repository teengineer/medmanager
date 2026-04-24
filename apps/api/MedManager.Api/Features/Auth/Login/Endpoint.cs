using FastEndpoints;
using FluentValidation;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using MedManager.Api.Features.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace MedManager.Api.Features.Auth.Login;

public record LoginRequest(string Email, string Password);

public class LoginValidator : Validator<LoginRequest>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class LoginEndpoint(
    AppDbContext db,
    IPasswordHasher hasher,
    ITokenService tokens,
    IOptions<JwtOptions> jwt,
    IHostEnvironment env)
    : Endpoint<LoginRequest, AuthResponse>
{
    public override void Configure()
    {
        Post("/auth/login");
        AllowAnonymous();
        Description(b => b.WithName("Login").WithTags("auth"));
    }

    public override async Task HandleAsync(LoginRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null || !hasher.Verify(req.Password, user.PasswordHash))
        {
            await SendAsync(default!, 401, ct);
            return;
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
}
