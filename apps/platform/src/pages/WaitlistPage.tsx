import { useEffect, useState } from "react";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { api, errorMessage } from "../lib/api";

interface WaitlistEntry {
  id: string;
  name: string;
  phone: string;
  email: string;
  reason: string;
  city: string | null;
  createdAt: string;
}

interface CityGroup {
  city: string;
  count: number;
  entries: WaitlistEntry[];
}

interface Response {
  total: number;
  cities: number;
  groups: CityGroup[];
}

export function WaitlistPage() {
  const [data, setData] = useState<Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openCity, setOpenCity] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Response>("/platform/waitlist")
      .then((res) => {
        setData(res.data);
        if (res.data.groups.length > 0) {
          setOpenCity(res.data.groups[0].city);
        }
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error)
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  if (!data) return <p className="text-slate-500">Loading…</p>;

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Waitlist</h1>
        <p className="mt-1 text-sm text-slate-500">
          {data.total === 0
            ? "No one on the waitlist yet."
            : `${data.total} ${
                data.total === 1 ? "person" : "people"
              } waiting across ${data.cities} ${
                data.cities === 1 ? "city" : "cities"
              }. Onboard the city with the most demand first.`}
        </p>
      </header>

      {data.groups.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          When someone uses the app in a city where RestFit has no gym, they
          can join the waitlist. Their names will appear here, grouped by city.
        </p>
      ) : (
        <div className="space-y-3">
          {data.groups.map((group) => {
            const open = openCity === group.city;
            return (
              <div
                key={group.city}
                className="overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                <button
                  onClick={() => setOpenCity(open ? null : group.city)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-slate-400" />
                    <span className="font-semibold">{group.city}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {group.count}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {open ? "Hide" : "Show"}
                  </span>
                </button>

                {open && (
                  <div className="divide-y border-t border-slate-100">
                    {group.entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{entry.name}</p>
                          <p className="text-xs text-slate-500">
                            {entry.phone} · {entry.email}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {entry.reason} ·{" "}
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <a
                            href={`tel:${entry.phone}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Phone size={13} />
                            Call
                          </a>
                          <a
                            href={`https://wa.me/${entry.phone.replace(
                              /\D/g,
                              "",
                            )}?text=${encodeURIComponent(
                              `Hi ${
                                entry.name.split(" ")[0]
                              }! This is RestFit. You're on our waitlist for ${
                                group.city
                              }. We're onboarding gyms there now — want me to let you know when one near you joins?`,
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                          >
                            <MessageCircle size={13} />
                            WhatsApp
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}