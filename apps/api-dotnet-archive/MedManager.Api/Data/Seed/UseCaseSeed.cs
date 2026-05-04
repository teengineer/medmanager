using MedManager.Api.Domain;

namespace MedManager.Api.Data.Seed;

public static class UseCaseSeed
{
    public static IReadOnlyList<UseCase> All { get; } = BuildCatalog().ToList();

    private static IEnumerable<UseCase> BuildCatalog()
    {
        var data = new (string Slug, string Tr, string En, string? Icd)[]
        {
            ("headache",          "Baş ağrısı",              "Headache",              "R51"),
            ("migraine",          "Migren",                  "Migraine",              "G43"),
            ("fever",             "Ateş",                    "Fever",                 "R50"),
            ("sore-throat",       "Boğaz ağrısı",            "Sore throat",           "J02"),
            ("common-cold",       "Nezle",                   "Common cold",           "J00"),
            ("flu",               "Grip",                    "Flu",                   "J11"),
            ("cough",             "Öksürük",                 "Cough",                 "R05"),
            ("runny-nose",        "Burun akıntısı",          "Runny nose",            "J34"),
            ("nasal-congestion",  "Burun tıkanıklığı",       "Nasal congestion",      "R09"),
            ("sinusitis",         "Sinüzit",                 "Sinusitis",             "J32"),
            ("otitis",            "Kulak iltihabı",          "Ear infection",         "H66"),
            ("nausea",            "Mide bulantısı",          "Nausea",                "R11"),
            ("vomiting",          "Kusma",                   "Vomiting",              "R11"),
            ("diarrhea",          "İshal",                   "Diarrhea",              "K52"),
            ("constipation",      "Kabızlık",                "Constipation",          "K59"),
            ("stomach-pain",      "Mide ağrısı",             "Stomach pain",          "R10"),
            ("indigestion",       "Hazımsızlık",             "Indigestion",           "K30"),
            ("heartburn",         "Mide ekşimesi",           "Heartburn",             "R12"),
            ("gastritis",         "Gastrit",                 "Gastritis",             "K29"),
            ("reflux",            "Reflü",                   "Reflux",                "K21"),
            ("allergy",           "Alerji",                  "Allergy",               "T78"),
            ("hay-fever",         "Saman nezlesi",           "Hay fever",             "J30"),
            ("asthma",            "Astım",                   "Asthma",                "J45"),
            ("skin-rash",         "Cilt döküntüsü",          "Skin rash",             "R21"),
            ("itching",           "Kaşıntı",                 "Itching",               "L29"),
            ("eczema",            "Egzama",                  "Eczema",                "L30"),
            ("acne",              "Akne",                    "Acne",                  "L70"),
            ("fungal-infection",  "Mantar enfeksiyonu",      "Fungal infection",      "B35"),
            ("wound-care",        "Yara bakımı",             "Wound care",            null),
            ("insect-bite",       "Böcek ısırığı",           "Insect bite",           "T14"),
            ("sunburn",           "Güneş yanığı",            "Sunburn",               "L55"),
            ("back-pain",         "Bel ağrısı",              "Back pain",             "M54"),
            ("muscle-pain",       "Kas ağrısı",              "Muscle pain",           "M79"),
            ("joint-pain",        "Eklem ağrısı",            "Joint pain",            "M25"),
            ("arthritis",         "Artrit",                  "Arthritis",             "M19"),
            ("menstrual-pain",    "Adet ağrısı",             "Menstrual pain",        "N94"),
            ("insomnia",          "Uykusuzluk",              "Insomnia",              "G47"),
            ("anxiety",           "Anksiyete",               "Anxiety",               "F41"),
            ("hypertension",      "Yüksek tansiyon",         "Hypertension",          "I10"),
            ("hypotension",       "Düşük tansiyon",          "Low blood pressure",    "I95"),
            ("diabetes",          "Diyabet",                 "Diabetes",              "E11"),
            ("high-cholesterol",  "Yüksek kolesterol",       "High cholesterol",      "E78"),
            ("dry-eyes",          "Göz kuruluğu",            "Dry eyes",              "H04"),
            ("conjunctivitis",    "Konjonktivit",            "Conjunctivitis",        "H10"),
            ("toothache",         "Diş ağrısı",              "Toothache",             "K08"),
            ("mouth-ulcer",       "Ağız içi yarası",         "Mouth ulcer",           "K12"),
            ("urinary-tract",     "İdrar yolu enfeksiyonu",  "Urinary tract infection","N39"),
            ("vitamin-deficiency","Vitamin eksikliği",       "Vitamin deficiency",    "E56"),
            ("anemia",            "Anemi",                   "Anemia",                "D64"),
            ("motion-sickness",   "Taşıt tutması",           "Motion sickness",       "T75"),
        };

        var deterministicSeed = new Guid("00000000-0000-0000-0000-000000000000");
        var counter = 1;
        foreach (var (slug, tr, en, icd) in data)
        {
            var bytes = new byte[16];
            BitConverter.GetBytes(counter++).CopyTo(bytes, 0);
            yield return new UseCase
            {
                Id = new Guid(bytes),
                Slug = slug,
                NameTr = tr,
                NameEn = en,
                Icd10Code = icd,
            };
        }
    }
}
