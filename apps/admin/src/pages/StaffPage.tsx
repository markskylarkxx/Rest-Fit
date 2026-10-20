import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { api, errorMessage } from "../lib/api";
import { Field, Input } from "../components/ui";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  
  const [invite, setInvite] = useState({ name: "", email: "", role: "FRONT_DESK" });
  const [inviting, setInviting] = useState(false);

  const loadStaff = () => {
    api.get<StaffMember[]>("/staff")
      .then((r) => setStaff(r.data))
      .catch((e) => toast.error(errorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const submitInvite = async (e: FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      await api.post("/staff", invite);
      toast.success("Invite generated! Check the API console for the link.");
      setShowInvite(false);
      setInvite({ name: "", email: "", role: "FRONT_DESK" });
      loadStaff();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setInviting(false);
    }
  };

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <header>
          <h1 className="text-2xl font-semibold">Staff</h1>
          <p className="mt-1 text-sm text-slate-500">Manage who has access to this dashboard.</p>
        </header>
        <button onClick={() => setShowInvite(true)} className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700">
          <Plus size={16} /> Invite Staff
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-medium text-slate-600">Name</th>
              <th className="px-6 py-3 font-medium text-slate-600">Email</th>
              <th className="px-6 py-3 font-medium text-slate-600">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium">{s.name}</td>
                <td className="px-6 py-4 text-slate-500">{s.email}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {s.role.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Invite Staff</h2>
            <form onSubmit={submitInvite} className="space-y-4">
              <Field label="Full Name">
                <Input required value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} />
              </Field>
              <Field label="Email Address">
                <Input type="email" required value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
              </Field>
              <Field label="Role">
                <select 
                  value={invite.role} 
                  onChange={(e) => setInvite({ ...invite, role: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="FRONT_DESK">Front Desk</option>
                  <option value="TRAINER">Trainer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </Field>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowInvite(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
                <button type="submit" disabled={inviting} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50">
                  {inviting ? "Sending…" : "Generate Invite Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}