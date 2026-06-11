import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { MedicineForm } from "../../../features/medicines/MedicineForm";
import { useMedicine, useUpdateMedicine } from "../../../features/medicines/hooks";
import { BackButton } from "../../../features/navigation/BackButton";

export const Route = createFileRoute("/_authenticated/medicines/$id/edit")({
  component: EditMedicinePage,
});

function EditMedicinePage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const medicine = useMedicine(id);
  const update = useUpdateMedicine(id);

  if (medicine.isLoading) return <p className="p-6 text-mute">{t("common.loading")}</p>;
  if (!medicine.data) return <p className="p-6 text-mute">{t("medicine.not_found")}</p>;

  return (
    <main className="mx-auto max-w-xl p-4 pb-24">
      <div className="mb-6 flex items-center gap-3">
        <BackButton />
        <h1 className="text-2xl font-bold tracking-tight text-ink">{t("medicine.edit")}</h1>
      </div>
      <MedicineForm
        initial={medicine.data}
        submitLabel={t("common.save")}
        pending={update.isPending}
        onSubmit={async (input) => {
          await update.mutateAsync(input);
          await navigate({ to: "/medicines/$id", params: { id } });
        }}
      />
    </main>
  );
}
