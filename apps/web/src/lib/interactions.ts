export interface Interaction {
  a: string;
  b: string;
  risk: "high" | "medium";
  descriptionTr: string;
  descriptionEn: string;
}

export const INTERACTIONS: Interaction[] = [
  { a: "warfarin", b: "aspirin", risk: "high", descriptionTr: "Ciddi kanama riski", descriptionEn: "Serious bleeding risk" },
  { a: "warfarin", b: "ibuprofen", risk: "high", descriptionTr: "Ciddi kanama riski", descriptionEn: "Serious bleeding risk" },
  { a: "warfarin", b: "naproxen", risk: "high", descriptionTr: "Ciddi kanama riski", descriptionEn: "Serious bleeding risk" },
  { a: "methotrexate", b: "aspirin", risk: "high", descriptionTr: "Metotreksat toksisitesi riski", descriptionEn: "Methotrexate toxicity risk" },
  { a: "methotrexate", b: "ibuprofen", risk: "high", descriptionTr: "Metotreksat toksisitesi riski", descriptionEn: "Methotrexate toxicity risk" },
  { a: "lithium", b: "ibuprofen", risk: "high", descriptionTr: "Lityum toksisitesi riski", descriptionEn: "Lithium toxicity risk" },
  { a: "lithium", b: "naproxen", risk: "high", descriptionTr: "Lityum toksisitesi riski", descriptionEn: "Lithium toxicity risk" },
  { a: "sertraline", b: "tramadol", risk: "high", descriptionTr: "Serotonin sendromu riski", descriptionEn: "Serotonin syndrome risk" },
  { a: "fluoxetine", b: "tramadol", risk: "high", descriptionTr: "Serotonin sendromu riski", descriptionEn: "Serotonin syndrome risk" },
  { a: "paroxetine", b: "tramadol", risk: "high", descriptionTr: "Serotonin sendromu riski", descriptionEn: "Serotonin syndrome risk" },
  { a: "digoxin", b: "amiodarone", risk: "high", descriptionTr: "Digoksin toksisitesi riski", descriptionEn: "Digoxin toxicity risk" },
  { a: "simvastatin", b: "amiodarone", risk: "medium", descriptionTr: "Kas hasarı riski (miyopati)", descriptionEn: "Muscle damage risk (myopathy)" },
  { a: "enalapril", b: "spironolactone", risk: "medium", descriptionTr: "Yüksek potasyum riski", descriptionEn: "Hyperkalemia risk" },
  { a: "ramipril", b: "spironolactone", risk: "medium", descriptionTr: "Yüksek potasyum riski", descriptionEn: "Hyperkalemia risk" },
];

export interface DetectedInteraction {
  med1Name: string;
  med2Name: string;
  risk: "high" | "medium";
  descriptionTr: string;
  descriptionEn: string;
}

export function detectInteractions(
  medicines: Array<{ name: string; activeIngredient?: string | null }>,
): DetectedInteraction[] {
  const results: DetectedInteraction[] = [];
  for (let i = 0; i < medicines.length; i++) {
    for (let j = i + 1; j < medicines.length; j++) {
      const mi = medicines[i]!;
      const mj = medicines[j]!;
      const a = (mi.activeIngredient ?? "").toLowerCase();
      const b = (mj.activeIngredient ?? "").toLowerCase();
      if (!a || !b) continue;
      for (const rule of INTERACTIONS) {
        const match =
          (a.includes(rule.a) && b.includes(rule.b)) ||
          (a.includes(rule.b) && b.includes(rule.a));
        if (match) {
          results.push({
            med1Name: mi.name,
            med2Name: mj.name,
            risk: rule.risk,
            descriptionTr: rule.descriptionTr,
            descriptionEn: rule.descriptionEn,
          });
        }
      }
    }
  }
  return results;
}
