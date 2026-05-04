using FastEndpoints;
using MedManager.Api.Auth;
using Microsoft.Extensions.Options;

namespace MedManager.Api.Features.Push.GetPublicKey;

public record PublicKeyResponse(string? PublicKey, bool Configured);

public class GetPublicKeyEndpoint(IOptions<PushOptions> options)
    : EndpointWithoutRequest<PublicKeyResponse>
{
    public override void Configure()
    {
        Get("/push/vapid-public-key");
        AllowAnonymous();
        Description(b => b.WithName("PushPublicKey").WithTags("push"));
    }

    public override Task HandleAsync(CancellationToken ct)
    {
        var o = options.Value;
        return SendAsync(new PublicKeyResponse(o.PublicKey, o.IsConfigured), cancellation: ct);
    }
}
