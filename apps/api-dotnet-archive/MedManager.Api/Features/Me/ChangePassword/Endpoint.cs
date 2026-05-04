using FastEndpoints;
using FluentValidation;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace MedManager.Api.Features.Me.ChangePassword;

public record ChangePasswordRequest(string? CurrentPassword, string NewPassword);

public class ChangePasswordValidator : Validator<ChangePasswordRequest>
{
    public ChangePasswordValidator()
    {
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8).MaximumLength(200);
    }
}

public class ChangePasswordEndpoint(AppDbContext db, ICurrentUser current, IPasswordHasher hasher)
    : Endpoint<ChangePasswordRequest>
{
    public override void Configure()
    {
        Post("/me/password");
        Description(b => b.WithName("ChangePassword").WithTags("me"));
    }

    public override async Task HandleAsync(ChangePasswordRequest req, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == current.Id, ct);
        if (user is null)
        {
            await SendAsync(default!, 404, ct);
            return;
        }

        var alreadyHasPassword = !string.IsNullOrEmpty(user.PasswordHash);
        if (alreadyHasPassword)
        {
            if (string.IsNullOrEmpty(req.CurrentPassword) || !hasher.Verify(req.CurrentPassword, user.PasswordHash))
            {
                AddError(r => r.CurrentPassword, "Current password is incorrect.");
                await SendErrorsAsync(400, ct);
                return;
            }
        }

        user.PasswordHash = hasher.Hash(req.NewPassword);
        await db.SaveChangesAsync(ct);
        await SendNoContentAsync(ct);
    }
}
