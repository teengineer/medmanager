using System.Text.Json;
using MedManager.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using WebPush;

namespace MedManager.Api.Auth;

public class ExpiryNotifier(
    IServiceProvider services,
    IOptionsMonitor<PushOptions> pushOptions,
    ILogger<ExpiryNotifier> logger)
    : BackgroundService
{
    private static readonly int[] NotifyDaysBefore = [30, 7, 1, 0];
    private static readonly TimeOnly RunAt = new(9, 0);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var delay = DelayUntilNextRun();
                await Task.Delay(delay, stoppingToken);
                if (!pushOptions.CurrentValue.IsConfigured)
                {
                    logger.LogDebug("Push not configured; skipping expiry notifier tick");
                    continue;
                }
                await RunAsync(stoppingToken);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                logger.LogError(ex, "Expiry notifier tick failed");
            }
        }
    }

    private static TimeSpan DelayUntilNextRun()
    {
        var now = DateTime.UtcNow;
        var todayRun = now.Date.Add(RunAt.ToTimeSpan());
        var next = now < todayRun ? todayRun : todayRun.AddDays(1);
        return next - now;
    }

    private async Task RunAsync(CancellationToken ct)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var upperBound = today.AddDays(NotifyDaysBefore.Max());

        var candidates = await db.Medicines
            .Where(m => m.Quantity > 0 && m.ExpiryDate <= upperBound)
            .Include(m => m.User)
            .ToListAsync(ct);

        foreach (var medicine in candidates)
        {
            var effective = medicine.EffectiveExpiry;
            var daysLeft = effective.DayNumber - today.DayNumber;
            if (!NotifyDaysBefore.Contains(daysLeft)) continue;

            var subs = await db.PushSubscriptions
                .Where(s => s.UserId == medicine.UserId)
                .ToListAsync(ct);
            if (subs.Count == 0) continue;

            var locale = medicine.User.Locale;
            var payload = JsonSerializer.Serialize(new
            {
                title = locale == "en" ? "Medicine expiry reminder" : "İlaç son kullanma uyarısı",
                body = locale == "en"
                    ? $"{medicine.Name} — expires in {daysLeft} days."
                    : $"{medicine.Name} — {daysLeft} gün içinde sona eriyor.",
                url = $"/medicines/{medicine.Id}",
            });

            foreach (var sub in subs)
            {
                try
                {
                    await SendAsync(sub, payload);
                }
                catch (WebPushException ex) when (ex.StatusCode is System.Net.HttpStatusCode.Gone
                                                  or System.Net.HttpStatusCode.NotFound)
                {
                    db.PushSubscriptions.Remove(sub);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Push send failed for sub {SubId}", sub.Id);
                }
            }
        }

        await db.SaveChangesAsync(ct);
    }

    private Task SendAsync(Domain.PushSubscriptionEntity sub, string payload)
    {
        var opts = pushOptions.CurrentValue;
        var vapid = new VapidDetails(opts.Subject, opts.PublicKey!, opts.PrivateKey!);
        var webPush = new WebPushClient();
        var target = new WebPush.PushSubscription(sub.Endpoint, sub.P256dh, sub.Auth);
        return webPush.SendNotificationAsync(target, payload, vapid);
    }
}
