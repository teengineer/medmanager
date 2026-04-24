using MedManager.Api.Domain;

namespace MedManager.Api.Features.Auth;

public record MeDto(
    Guid Id,
    string Email,
    string? FirstName,
    string? LastName,
    string Locale,
    string TimeZone,
    bool HasPassword,
    DateTime CreatedAt)
{
    public static MeDto From(User user) => new(
        user.Id,
        user.Email,
        user.FirstName,
        user.LastName,
        user.Locale,
        user.TimeZone,
        !string.IsNullOrEmpty(user.PasswordHash),
        user.CreatedAt);
}

public record AuthResponse(string AccessToken, int ExpiresInSeconds, MeDto User);
