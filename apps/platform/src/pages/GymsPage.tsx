import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, errorMessage } from "../lib/api";

interface Gym {
  id: string;
  name: string;
  joinCode: string;
  status: string;
  phone: string | null;
  createdAt: string;
  staff: { name: string; email: string }[];
  _count: { members: number };
}

export function GymsPage() {
  const [gyms, setGyms] = useState<Gym[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Gym[]>("/platform/gyms")
      .then((res) => setGyms(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error)
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  if (!gyms) return <p className="text-slate-500">Loading…</p>;

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">All gyms</h1>
        <p className="mt-1 text-sm text-slate-500">
          {gyms.length} gym{gyms.length === 1 ? "" : "s"} on the platform
        </p>
      </header>

      <div className="space-y-3">
        {gyms.map((gym) => {
          const owner = gym.staff[0];
          return (
            <Link
              key={gym.id}
              to={`/gyms/${gym.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={gym.status} />
                    <span className="font-mono text-xs text-slate-500">
                      {gym.joinCode}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold">{gym.name}</p>
                  {owner && (
                    <p className="text-sm text-slate-600">
                      {owner.name} · {owner.email}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {gym._count.members} member
                    {gym._count.members === 1 ? "" : "s"} ·{" "}
                    {new Date(gym.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "APPROVED"
      ? "bg-emerald-50 text-emerald-700"
      : status === "PENDING"
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      {status}
    </span>
  );
}