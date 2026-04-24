using FastEndpoints;

namespace MedManager.Api.Features.Health;

public record HealthResponse(bool Ok, string Version);

public class HealthEndpoint : EndpointWithoutRequest<HealthResponse>
{
    public override void Configure()
    {
        Get("/health");
        AllowAnonymous();
        Description(b => b.WithName("Health").WithTags("meta"));
    }

    public override Task HandleAsync(CancellationToken ct)
    {
        return SendAsync(new HealthResponse(true, "0.0.0"), cancellation: ct);
    }
}
