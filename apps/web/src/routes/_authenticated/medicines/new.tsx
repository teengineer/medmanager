import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { MedicineForm } from "../../../features/medicines/MedicineForm";
import { useCreateMedicine } from "../../../features/medicines/hooks";
import { BackButton } from "../../../features/navigation/BackButton";

export const Route = createFileRoute("/_authenticated/medicines/new")({
  component: NewMedicinePage,
});

function NewMedicinePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const create = useCreateMedicine();

  return (
    <main className="mx-auto max-w-xl p-4 pb-24">
      <div className="mb-6 flex items-center gap-3">
        <BackButton />
        <h1 className="text-2xl font-bold tracking-tight text-ink">{t("medicine.add")}</h1>
      </div>
      <MedicineForm
        submitLabel={t("medicine.add")}
        pending={create.isPending}
        onSubmit={async (input) => {
          const result = await create.mutateAsync(input);
          await navigate({ to: "/medicines/$id", params: { id: result.id } });
        }}
      />
    </main>
  );
}
