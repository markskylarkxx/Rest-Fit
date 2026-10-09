import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Badge, Empty, ErrorNote, Field, Input, Loading, Modal, PageHeader } from "../components/ui";
import { api, errorMessage } from "../lib/api";
import { formatNaira } from "../lib/format";
import type { Plan } from "../lib/types";
import { useFetch } from "../lib/useFetch";

// Owners think in naira, the API stores kobo.
const formSchema = z.object({
  name: z.string().trim().min(2, "Plan name is required"),
  priceNaira: z.coerce.number().min(1, "Enter a price"),
  durationDays: z.coerce.number().int().min(1, "At least 1 day"),
});
type FormIn = z.input<typeof formSchema>;
type FormOut = z.output<typeof formSchema>;

const presets = [
  { label: "Monthly", days: 30 },
  { label: "Quarterly", days: 90 },
  { label: "Yearly", days: 365 },
  { label: "Day pass", days: 1 },
];

export function PlansPage() {
  const { data, error, loading, reload } = useFetch<Plan[]>("/plans");
  const [adding, setAdding] = useState(false);
  const { register, handleSubmit, formState, reset, setValue } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = handleSubmit(async (v) => {
    try {
      await api.post("/plans", { name: v.name, priceKobo: Math.round(v.priceNaira * 100), durationDays: v.durationDays });
      toast.success("Plan created");
      reset();
      setAdding(false);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  });

  const toggle = async (plan: Plan) => {
    try {
      await api.patch(`/plans/${plan.id}`, { active: !plan.active });
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Membership plans"
        subtitle="What members can buy. Hidden plans stay on old records but can't be sold."
        action={
          <button className="btn-primary" onClick={() => setAdding(true)}>
            <Plus size={16} /> New plan
          </button>
        }
      />

      {error && <ErrorNote message={error} />}
      {loading && !data ? (
        <Loading />
      ) : !data?.length ? (
        <div className="card">
          <Empty>No plans yet. Create one, e.g. "Monthly — ₦25,000 for 30 days".</Empty>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{p.name}</h3>
                {!p.active && <Badge tone="slate">Hidden</Badge>}
              </div>
              <p className="mt-3 text-2xl font-semibold">{formatNaira(p.priceKobo)}</p>
              <p className="text-sm text-slate-500">
                {p.durationDays} day{p.durationDays === 1 ? "" : "s"}
              </p>
              <button className="mt-4 text-sm font-medium text-brand-700" onClick={() => toggle(p)}>
                {p.active ? "Hide plan" : "Show plan"}
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="New plan">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
                onClick={() => {
                  setValue("name", p.label);
                  setValue("durationDays", p.days);
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Field label="Name" error={formState.errors.name?.message}>
            <Input {...register("name")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₦)" error={formState.errors.priceNaira?.message}>
              <Input type="number" min={1} step="any" {...register("priceNaira")} />
            </Field>
            <Field label="Length (days)" error={formState.errors.durationDays?.message}>
              <Input type="number" min={1} {...register("durationDays")} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button className="btn-primary" disabled={formState.isSubmitting}>
              Create plan
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
