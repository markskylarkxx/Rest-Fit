import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { memberSchema, type MemberInput } from "@restfit/shared";
import type { z } from "zod";
import { MembershipBadge } from "../components/MembershipBadge";
import { Empty, ErrorNote, Field, Input, Loading, Modal, PageHeader } from "../components/ui";
import { api, errorMessage } from "../lib/api";
import { formatDate, formatPhone, fullName } from "../lib/format";
import type { MemberDetail, MemberSummary } from "../lib/types";
import { useFetch } from "../lib/useFetch";

const filters = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "expiring", label: "Ending this week" },
  { value: "inactive", label: "No active plan" },
];

export function MembersPage() {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [adding, setAdding] = useState(false);

  // Wait for typing to pause before searching.
  useEffect(() => {
    const t = setTimeout(() => setQuery(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, error, loading } = useFetch<MemberSummary[]>(`/members?status=${status}&q=${encodeURIComponent(query)}`);

  return (
    <>
      <PageHeader
        title="Members"
        action={
          <button className="btn-primary" onClick={() => setAdding(true)}>
            <Plus size={16} /> Add member
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email or code" className="input pl-9" />
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={clsx("rounded-md px-3 py-1.5 text-sm", status === f.value ? "bg-white font-medium shadow-sm" : "text-slate-600")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorNote message={error} />}
      <div className="card overflow-x-auto">
        {loading && !data ? (
          <Loading />
        ) : !data?.length ? (
          <Empty>{query || status !== "all" ? "No members match." : "No members yet. Add your first one."}</Empty>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="table-head">Name</th>
                <th className="table-head">Phone</th>
                <th className="table-head">Plan</th>
                <th className="table-head">Active until</th>
                <th className="table-head">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="table-cell font-medium">
                    <Link to={`/members/${m.id}`} className="hover:underline">
                      {fullName(m)}
                    </Link>
                  </td>
                  <td className="table-cell text-slate-600">{formatPhone(m.phone)}</td>
                  <td className="table-cell text-slate-600">{m.planName ?? "—"}</td>
                  <td className="table-cell text-slate-600">{formatDate(m.activeUntil)}</td>
                  <td className="table-cell">
                    <MembershipBadge activeUntil={m.activeUntil} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <MemberFormModal open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

type FormValues = z.input<typeof memberSchema>;

// Used for both adding a member and editing one (when `member` is passed).
export function MemberFormModal({
  open,
  onClose,
  member,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  member?: MemberDetail;
  onSaved?: () => void;
}) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState, reset } = useForm<FormValues, unknown, MemberInput>({
    resolver: zodResolver(memberSchema),
  });

  useEffect(() => {
    if (!open) return;
    reset({
      firstName: member?.firstName ?? "",
      lastName: member?.lastName ?? "",
      phone: member ? formatPhone(member.phone) : "",
      email: member?.email ?? "",
      gender: member?.gender ?? undefined,
      emergencyContact: member?.emergencyContact ?? "",
      notes: member?.notes ?? "",
    });
  }, [open, member, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (member) {
        await api.patch(`/members/${member.id}`, values);
        toast.success("Member updated");
        onSaved?.();
        onClose();
      } else {
        const { data } = await api.post<MemberSummary>("/members", values);
        toast.success("Member added. Now start their membership.");
        navigate(`/members/${data.id}`);
      }
    } catch (err) {
      toast.error(errorMessage(err));
    }
  });

  const e = formState.errors;
  return (
    <Modal open={open} onClose={onClose} title={member ? "Edit member" : "Add member"}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" error={e.firstName?.message}>
            <Input autoFocus {...register("firstName")} />
          </Field>
          <Field label="Last name" error={e.lastName?.message}>
            <Input {...register("lastName")} />
          </Field>
        </div>
        <Field label="Phone (WhatsApp)" error={e.phone?.message}>
          <Input type="tel" placeholder="0803 000 0000" {...register("phone")} />
        </Field>
        <Field label="Email (needed for online payments)" error={e.email?.message}>
          <Input type="email" {...register("email")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Gender" error={e.gender?.message}>
            <select className="input" {...register("gender", { setValueAs: (v) => v || undefined })}>
              <option value="">—</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </Field>
          <Field label="Emergency contact" error={e.emergencyContact?.message}>
            <Input {...register("emergencyContact")} />
          </Field>
        </div>
        <Field label="Notes" error={e.notes?.message}>
          <textarea rows={2} className="input" placeholder="Injuries, goals, anything trainers should know" {...register("notes")} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" disabled={formState.isSubmitting}>
            {member ? "Save" : "Add member"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
