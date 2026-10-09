import { useState } from "react";
import { X } from "lucide-react";
import { Button, Field, Input } from "./ui";

export function InviteGymModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  if (!open) return null;

  const invite = () => {
    const clean = phone.replace(/\D/g, "");
    // Convert 0XXX to 234XXX
    const intl = clean.startsWith("0") ? `234${clean.slice(1)}` : clean;

    const message = encodeURIComponent(
      `Hi${name ? ` ${name}` : ""}! I'm using RestFit to track my fitness and I'd love to see my membership here too. ` +
        `Would you consider signing up? It would let me check in with my phone, renew online, and see my membership in one place. ` +
        `Learn more: https://restfit.com`
    );

    window.open(`https://wa.me/${intl}?text=${message}`, "_blank");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="card-elevated w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            Invite your gym
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/40 hover:bg-white/5"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-white/50">
          Send your gym a WhatsApp message. If they sign up, you'll unlock
          membership features in the app.
        </p>

        <div className="mt-5 space-y-4">
          <Field label="Gym name (optional)">
            <Input
              placeholder="Iron Gym"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="Gym's WhatsApp number">
            <Input
              type="tel"
              inputMode="tel"
              placeholder="0803 111 2222"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>

          <Button
            onClick={invite}
            disabled={!phone.trim()}
            className="w-full"
          >
            Send via WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}