import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";

/**
 * Opens a payment link. On native, uses the in-app browser.
 * On web, falls back to a normal redirect.
 */
export async function openPaymentLink(url: string) {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url, windowName: "_self" });
  } else {
    window.location.href = url;
  }
}

/**
 * Closes the in-app browser if it's open. Safe to call anytime.
 */
export async function closePaymentBrowser() {
  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.close();
    } catch {
      /* already closed */
    }
  }
}

/**
 * Waits for the app to become visible again (user returned from payment),
 * then runs the callback. Auto-cleans up its listeners.
 */
export function onReturnFromBrowser(cb: () => void) {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    cleanup();
    cb();
  };
  const onVis = () => {
    if (document.visibilityState === "visible") run();
  };
  const onFocus = () => run();
  const cleanup = () => {
    document.removeEventListener("visibilitychange", onVis);
    window.removeEventListener("focus", onFocus);
  };
  document.addEventListener("visibilitychange", onVis);
  window.addEventListener("focus", onFocus);
  // Safety: also run on unmount if nothing else fires
  return cleanup;
}