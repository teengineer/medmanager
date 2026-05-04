namespace MedManager.Api.Domain;

public class UseCase
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string Slug { get; set; }
    public required string NameTr { get; set; }
    public required string NameEn { get; set; }
    public string? Icd10Code { get; set; }

    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public List<MedicineUseCase> Medicines { get; set; } = [];
}

public class MedicineUseCase
{
    public Guid MedicineId { get; set; }
    public Guid UseCaseId { get; set; }

    public Medicine Medicine { get; set; } = null!;
    public UseCase UseCase { get; set; } = null!;
}
