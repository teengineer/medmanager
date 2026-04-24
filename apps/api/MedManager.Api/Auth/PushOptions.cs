namespace MedManager.Api.Auth;

public class PushOptions
{
    public const string Section = "Push";

    public string Subject { get; set; } = "mailto:admin@medmanager.local";
    public string? PublicKey { get; set; }
    public string? PrivateKey { get; set; }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(PublicKey) && !string.IsNullOrWhiteSpace(PrivateKey);
}
