using System.Text;
using System.Text.RegularExpressions;
using FastEndpoints;
using FluentValidation;
using MedManager.Api.Auth;
using MedManager.Api.Data;
using MedManager.Api.Domain;
using MedManager.Api.Features.UseCases.List;

namespace MedManager.Api.Features.UseCases.Create;

public record CreateUseCaseRequest(string Name);

public class CreateUseCaseValidator : Validator<CreateUseCaseRequest>
{
    public CreateUseCaseValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MinimumLength(2).MaximumLength(200);
    }
}

public class CreateUseCaseEndpoint(AppDbContext db, ICurrentUser current)
    : Endpoint<CreateUseCaseRequest, UseCaseDto>
{
    public override void Configure()
    {
        Post("/use-cases");
        Description(b => b.WithName("CreateUseCase").WithTags("use-cases"));
    }

    public override async Task HandleAsync(CreateUseCaseRequest req, CancellationToken ct)
    {
        var name = req.Name.Trim();
        var slug = $"{Slugify(name)}-{current.Id:N}"[..Math.Min(64, Slugify(name).Length + 33)];

        var uc = new UseCase
        {
            Slug = slug,
            NameTr = name,
            NameEn = name,
            UserId = current.Id,
        };
        db.UseCases.Add(uc);
        await db.SaveChangesAsync(ct);

        await SendAsync(new UseCaseDto(uc.Id, uc.Slug, name, null), 201, ct);
    }

    private static string Slugify(string input)
    {
        var normalized = input.ToLowerInvariant()
            .Replace("ı", "i").Replace("ğ", "g").Replace("ü", "u")
            .Replace("ş", "s").Replace("ö", "o").Replace("ç", "c");
        var sb = new StringBuilder();
        foreach (var ch in normalized)
        {
            if (char.IsLetterOrDigit(ch)) sb.Append(ch);
            else if (ch is ' ' or '-' or '_') sb.Append('-');
        }
        var slug = Regex.Replace(sb.ToString(), "-+", "-").Trim('-');
        return string.IsNullOrEmpty(slug) ? "custom" : slug;
    }
}
