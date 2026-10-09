// apps/member/src/pages/QrCodePage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { QrCode, WifiOff } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { api, errorMessage } from "../lib/api";
import { Card, ErrorNote, Spinner } from "../components/ui";

const CACHE_KEY = "restfit_qr_cache";

interface CachedQr {
  code: string;
  gymName: string;
  cachedAt: string;
}

function readCache(id: string): CachedQr | null {
  try {
    const raw = localStorage.getItem(`${CACHE_KEY}:${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(id: string, data: CachedQr) {
  try {
    localStorage.setItem(`${CACHE_KEY}:${id}`, JSON.stringify(data));
  } catch {
    /* ignore quota errors */
  }
}

export function QrCodePage() {
  const { id } = useParams();
  const cacheId = id ?? "primary";
  const [code, setCode] = useState<string | null>(null);
  const [gymName, setGymName] = useState("");
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 1. Instant paint from cache
    const cached = readCache(cacheId);
    if (cached) {
      setCode(cached.code);
      setGymName(cached.gymName);
    }

    // 2. Refresh in background
    const endpoint = id ? `/app/memberships/${id}` : "/app/me";
    const fetch = async () => {
      try {
        if (id) {
          const { data } = await api.get<{
            checkInCode: string;
            gym: { name: string };
          }>(endpoint);
          setCode(data.checkInCode);
          setGymName(data.gym.name);
          writeCache(cacheId, {
            code: data.checkInCode,
            gymName: data.gym.name,
            cachedAt: new Date().toISOString(),
          });
        } else {
          const me = await api.get<{
            memberships: { id: string; gym: { name: string } }[];
          }>(endpoint);
          const first = me.data.memberships[0];
          if (!first) {
            if (!cached) setError("You're not a member of any gym yet");
            return;
          }
          const detail = await api.get<{
            checkInCode: string;
            gym: { name: string };
          }>(`/app/memberships/${first.id}`);
          setCode(detail.data.checkInCode);
          setGymName(detail.data.gym.name);
          writeCache(cacheId, {
            code: detail.data.checkInCode,
            gymName: detail.data.gym.name,
            cachedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        if (!cached) setError(errorMessage(err));
        else setOffline(true);
      }
    };
    fetch();
  }, [id, cacheId]);

  if (error)
    return (
      <div className="p-5">
        <ErrorNote message={error} />
      </div>
    );
  if (!code) return <Spinner />;

  return (
    <div className="min-h-screen pb-28">
      <header className="px-6 pt-8 pb-4">
        <h1 className="heading">Check in</h1>
        <p className="subheading mt-1">{gymName}</p>
      </header>

      <div className="px-6">
        <Card className="flex flex-col items-center gap-6 border-none bg-white p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <QrCode size={14} /> Show at the door
          </div>

          <QRCodeSVG value={code} size={240} level="M" />

          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Or say this code
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tracking-[0.4em] text-slate-900">
              {code}
            </p>
          </div>
        </Card>

        {offline ? (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-amber-300">
            <WifiOff size={14} />
            <span>Offline — showing last saved code</span>
          </div>
        ) : (
          <p className="mt-6 text-center text-xs text-white/40">
            Works offline. No signal needed at the door.
          </p>
        )}
      </div>
    </div>
  );
}