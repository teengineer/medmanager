using System.Security.Claims;
using System.Security.Cryptography;
using FastEndpoints.Security;
using MedManager.Api.Data;
using MedManager.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace MedManager.Api.Auth;

public interface ITokenService
{
    string CreateAccessToken(User user);
    Task<(string PlainText, RefreshToken Entity)> IssueRefreshTokenAsync(User user, CancellationToken ct);
    Task<RefreshToken?> FindActiveRefreshTokenAsync(string plainText, CancellationToken ct);
    Task RevokeAsync(RefreshToken token, CancellationToken ct);
}

public class TokenService(AppDbContext db, IOptions<JwtOptions> jwtOptions) : ITokenService
{
    private readonly JwtOptions _jwt = jwtOptions.Value;

    public string CreateAccessToken(User user)
    {
        return JwtBearer.CreateToken(o =>
        {
            o.SigningKey = _jwt.SigningKey;
            o.Issuer = _jwt.Issuer;
            o.Audience = _jwt.Audience;
            o.ExpireAt = DateTime.UtcNow.AddMinutes(_jwt.AccessTokenMinutes);
            o.User.Claims.Add((ClaimTypes.NameIdentifier, user.Id.ToString()));
            o.User.Claims.Add((ClaimTypes.Email, user.Email));
            o.User.Claims.Add(("locale", user.Locale));
        });
    }

    public async Task<(string PlainText, RefreshToken Entity)> IssueRefreshTokenAsync(User user, CancellationToken ct)
    {
        var plainText = GenerateSecureTokenString(32);
        var entity = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = Hash(plainText),
            ExpiresAt = DateTime.UtcNow.AddDays(_jwt.RefreshTokenDays),
        };
        db.RefreshTokens.Add(entity);
        await db.SaveChangesAsync(ct);
        return (plainText, entity);
    }

    public Task<RefreshToken?> FindActiveRefreshTokenAsync(string plainText, CancellationToken ct)
    {
        var hash = Hash(plainText);
        return db.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == hash && t.RevokedAt == null && t.ExpiresAt > DateTime.UtcNow, ct);
    }

    public async Task RevokeAsync(RefreshToken token, CancellationToken ct)
    {
        token.RevokedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private static string GenerateSecureTokenString(int bytes)
    {
        var buffer = RandomNumberGenerator.GetBytes(bytes);
        return Convert.ToBase64String(buffer)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private static string Hash(string value)
    {
        var bytes = System.Text.Encoding.UTF8.GetBytes(value);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash);
    }
}
