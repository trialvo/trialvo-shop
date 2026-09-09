"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  FALLBACK_PUBLIC_TRIAL_CONFIG,
  usePublicTrialConfig,
  type PublicTrialConfig,
} from "@/hooks/useTrialSettings";
import type { TrialPath, TrialProductRef } from "@/lib/trial/types";
import { InstantDemoDialog } from "./instant-demo/InstantDemoDialog";
import { DomainTrialWizard } from "./domain-trial/DomainTrialWizard";

/**
 * One place that owns the two trial dialogs for the whole site.
 *
 * Any button — hero, product card, buy card, sticky bar, status hub — calls
 * `useTrialLaunch().openDemo(...)` or `.openDomain(...)`. That means:
 *   - a single dialog instance per path (no duplicate modals per product card),
 *   - deep links like `/products/x?trial=domain&from=<token>` open the right
 *     flow on load, which the demo email relies on,
 *   - the home page can offer "Get instant demo" without a product in scope;
 *     the dialog shows a product picker step first.
 */

export type DomainPrefill = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
};

export type TrialLaunchOptions = {
  /** Full product or a minimal ref. Omit to show the product picker. */
  product?: TrialProductRef | null;
  /** Slug only (deep link). The dialog resolves the product itself. */
  productSlug?: string | null;
  /** Domain path: link back to the demo this came from. */
  sourceRequestId?: string | null;
  /** Domain path: carry the demo form values forward. */
  prefill?: DomainPrefill | null;
};

type LaunchState = TrialLaunchOptions & { path: TrialPath | null };

type TrialLaunchContextValue = {
  config: PublicTrialConfig;
  configLoaded: boolean;
  openDemo: (opts?: TrialLaunchOptions) => void;
  openDomain: (opts?: TrialLaunchOptions) => void;
  close: () => void;
  /** Convenience: is a given path offered site-wide right now? */
  demoAvailable: boolean;
  domainAvailable: boolean;
};

const TrialLaunchContext = createContext<TrialLaunchContextValue | null>(null);

const CLOSED: LaunchState = { path: null };

export function TrialLaunchProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { data, isSuccess } = usePublicTrialConfig();
  const config = data ?? FALLBACK_PUBLIC_TRIAL_CONFIG;
  const [state, setState] = useState<LaunchState>(CLOSED);

  const openDemo = useCallback((opts: TrialLaunchOptions = {}) => {
    setState({ path: "demo", ...opts });
  }, []);
  const openDomain = useCallback((opts: TrialLaunchOptions = {}) => {
    setState({ path: "domain", ...opts });
  }, []);
  const close = useCallback(() => setState(CLOSED), []);

  // Deep link: ?trial=demo|domain[&product=slug][&from=token]. Read from
  // window rather than useSearchParams so this provider never forces a
  // Suspense boundary on every page.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const trial = params.get("trial");
    if (trial !== "demo" && trial !== "domain") return;

    const slugFromPath = window.location.pathname.match(/\/products\/([^/?#]+)/)?.[1] ?? null;
    const productSlug = params.get("product") || slugFromPath;
    const from = params.get("from");

    setState({
      path: trial,
      productSlug,
      sourceRequestId: from,
    });

    // Strip the params so refresh / back does not reopen the dialog.
    params.delete("trial");
    params.delete("product");
    params.delete("from");
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
  }, []);

  const value = useMemo<TrialLaunchContextValue>(
    () => ({
      config,
      configLoaded: isSuccess,
      openDemo,
      openDomain,
      close,
      demoAvailable: config.trialsEnabled && config.demoEnabled,
      domainAvailable: config.trialsEnabled && config.domainTrialEnabled,
    }),
    [config, isSuccess, openDemo, openDomain, close],
  );

  return (
    <TrialLaunchContext.Provider value={value}>
      {children}
      <InstantDemoDialog
        open={state.path === "demo"}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        product={state.product ?? null}
        productSlug={state.productSlug ?? null}
        onContinueToDomain={(opts) => setState({ path: "domain", ...opts })}
      />
      <DomainTrialWizard
        open={state.path === "domain"}
        onOpenChange={(open) => {
          if (!open) close();
        }}
        product={state.product ?? null}
        productSlug={state.productSlug ?? null}
        sourceRequestId={state.sourceRequestId ?? null}
        prefill={state.prefill ?? null}
      />
    </TrialLaunchContext.Provider>
  );
}

export function useTrialLaunch(): TrialLaunchContextValue {
  const ctx = useContext(TrialLaunchContext);
  if (!ctx) {
    throw new Error("useTrialLaunch must be used inside <TrialLaunchProvider>");
  }
  return ctx;
}

/** Non-throwing variant for components that may render outside the provider (e.g. admin). */
export function useOptionalTrialLaunch(): TrialLaunchContextValue | null {
  return useContext(TrialLaunchContext);
}
