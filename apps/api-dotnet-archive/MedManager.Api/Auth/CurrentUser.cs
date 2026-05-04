using System.Security.Claims;

namespace MedManager.Api.Auth;

public interface ICurrentUser
{
    Guid Id { get; }
    string Email { get; }
    bool IsAuthenticated { get; }
}

public class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    public bool IsAuthenticated => accessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;

    public Guid Id
    {
        get
        {
            var raw = accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? throw new InvalidOperationException("No authenticated user");
            return Guid.Parse(raw);
        }
    }

    public string Email =>
        accessor.HttpContext?.User.FindFirstValue(ClaimTypes.Email)
        ?? throw new InvalidOperationException("No authenticated user");
}
