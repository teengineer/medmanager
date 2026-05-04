using MedManager.Api.Data.Seed;
using MedManager.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace MedManager.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Medicine> Medicines => Set<Medicine>();
    public DbSet<UseCase> UseCases => Set<UseCase>();
    public DbSet<MedicineUseCase> MedicineUseCases => Set<MedicineUseCase>();
    public DbSet<PushSubscriptionEntity> PushSubscriptions => Set<PushSubscriptionEntity>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Email).HasMaxLength(320).IsRequired();
            e.Property(x => x.PasswordHash).HasMaxLength(200).IsRequired();
            e.Property(x => x.FirstName).HasMaxLength(100);
            e.Property(x => x.LastName).HasMaxLength(100);
            e.Property(x => x.Locale).HasMaxLength(8).IsRequired();
            e.Property(x => x.TimeZone).HasMaxLength(64).IsRequired();
        });

        b.Entity<RefreshToken>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.TokenHash).IsUnique();
            e.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            e.HasOne(x => x.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Medicine>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => new { x.UserId, x.ExpiryDate });
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.ActiveIngredient).HasMaxLength(200);
            e.Property(x => x.Strength).HasMaxLength(50);
            e.Property(x => x.Form).HasMaxLength(50);
            e.Property(x => x.Barcode).HasMaxLength(64);
            e.Property(x => x.Unit).HasMaxLength(32).IsRequired();
            e.Property(x => x.Notes).HasMaxLength(1000);
            e.Property(x => x.Quantity).HasPrecision(10, 2);
            e.Ignore(x => x.EffectiveExpiry);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<UseCase>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.Slug, x.UserId });
            e.HasIndex(x => x.UserId);
            e.Property(x => x.Slug).HasMaxLength(64).IsRequired();
            e.Property(x => x.NameTr).HasMaxLength(200).IsRequired();
            e.Property(x => x.NameEn).HasMaxLength(200).IsRequired();
            e.Property(x => x.Icd10Code).HasMaxLength(10);
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasData(UseCaseSeed.All);
        });

        b.Entity<MedicineUseCase>(e =>
        {
            e.HasKey(x => new { x.MedicineId, x.UseCaseId });
            e.HasOne(x => x.Medicine)
                .WithMany(m => m.UseCases)
                .HasForeignKey(x => x.MedicineId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.UseCase)
                .WithMany(u => u.Medicines)
                .HasForeignKey(x => x.UseCaseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<PushSubscriptionEntity>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Endpoint).IsUnique();
            e.HasIndex(x => x.UserId);
            e.Property(x => x.Endpoint).HasMaxLength(1024).IsRequired();
            e.Property(x => x.P256dh).HasMaxLength(256).IsRequired();
            e.Property(x => x.Auth).HasMaxLength(128).IsRequired();
            e.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

    public override int SaveChanges()
    {
        ApplyTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        ApplyTimestamps();
        return base.SaveChangesAsync(ct);
    }

    private void ApplyTimestamps()
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries<User>())
            if (entry.State == EntityState.Modified) entry.Entity.UpdatedAt = now;
        foreach (var entry in ChangeTracker.Entries<Medicine>())
            if (entry.State == EntityState.Modified) entry.Entity.UpdatedAt = now;
    }
}
