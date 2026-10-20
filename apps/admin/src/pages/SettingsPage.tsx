import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { api, errorMessage } from "../lib/api";
import { Field, Input } from "../components/ui";

export function SettingsPage() {
  const [gym, setGym] = useState({ name: "", phone: "", address: "" });
  const [savingGym, setSavingGym] = useState(false);

  const [passwords, setPasswords] = useState({ current: "", next: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    api.get("/dashboard").then((res) => {
      if (res.data.gym) {
        setGym({
          name: res.data.gym.name ?? "",
          phone: res.data.gym.phone ?? "",
          address: res.data.gym.address ?? "",
        });
      }
    });
  }, []);

  const saveGym = async (e: FormEvent) => {
    e.preventDefault();
    setSavingGym(true);
    try {
      await api.patch("/dashboard/gym", gym);
      toast.success("Gym details updated");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingGym(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await api.patch("/dashboard/me/password", {
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      toast.success("Password updated");
      setPasswords({ current: "", next: "" });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your gym and account.</p>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Gym Details</h2>
        <form onSubmit={saveGym} className="space-y-4">
          <Field label="Gym Name">
            <Input value={gym.name} onChange={(e) => setGym({ ...gym, name: e.target.value })} required />
          </Field>
          <Field label="Phone">
            <Input value={gym.phone} onChange={(e) => setGym({ ...gym, phone: e.target.value })} />
          </Field>
          <Field label="Address">
            <Input value={gym.address} onChange={(e) => setGym({ ...gym, address: e.target.value })} />
          </Field>
          <button type="submit" disabled={savingGym} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50">
            {savingGym ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Change Password</h2>
        <form onSubmit={savePassword} className="space-y-4">
          <Field label="Current Password">
            <Input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} required />
          </Field>
          <Field label="New Password">
            <Input type="password" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} required minLength={8} />
          </Field>
          <button type="submit" disabled={savingPassword} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50">
            {savingPassword ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}