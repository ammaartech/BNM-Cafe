'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase/provider';
import { toast } from '@/hooks/use-toast';
import { IS_DEMO } from '@/lib/demo';
import { TOURS, matchesPath, resolveCopy, type TourId, type TourStep } from './tour-steps';
import { TourCard, TourPausedPill } from './TourOverlay';

interface TourState {
  tourId: TourId;
  index: number;
}

interface TourContextValue {
  startTour: (tourId: TourId) => void;
  activeTour: TourId | null;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

// Progress survives reloads within the tab; "seen" stops the auto-start for good.
const PROGRESS_KEY = 'bnm-tour-progress';
const seenKey = (tourId: TourId) => `bnm-tour-seen:${tourId}`;
// Grace period before showing "Tour paused", so a Next that navigates doesn't flash it.
const PAUSE_DELAY_MS = 1200;

const storage = {
  get(store: 'local' | 'session', key: string) {
    try {
      return (store === 'local' ? localStorage : sessionStorage).getItem(key);
    } catch {
      return null;
    }
  },
  set(store: 'local' | 'session', key: string, value: string | null) {
    try {
      const s = store === 'local' ? localStorage : sessionStorage;
      if (value === null) s.removeItem(key);
      else s.setItem(key, value);
    } catch {
      // Storage blocked (private mode etc.) — the tour still works, it just won't persist.
    }
  },
};

const isTourId = (value: unknown): value is TourId => value === 'customer' || value === 'staff';

export function TourProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, isUserLoading } = useSupabase();

  const [state, setState] = useState<TourState | null>(null);
  const [restored, setRestored] = useState(false);
  const [paused, setPaused] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;
  // Set when the tour itself navigates, so the route sync ignores the old page.
  const leavingPathRef = useRef<string | null>(null);

  const isSignedIn = !!user && !user.is_anonymous;

  // A step is reachable if the visitor can actually be shown it right now.
  const isReachable = useCallback((step: TourStep) => {
    // Signed-in visitors get bounced off /login, so its steps are behind them.
    if (step.path === '/login' && isSignedIn) return false;
    // Optional steps live on dynamic URLs; only show them when already there.
    if (step.optional && !matchesPath(step, pathname)) return false;
    return true;
  }, [isSignedIn, pathname]);

  const goTo = useCallback((tourId: TourId, index: number) => {
    const step = TOURS[tourId][index];
    setState({ tourId, index });
    if (!matchesPath(step, pathname) && step.href) {
      leavingPathRef.current = pathname;
      router.push(step.href);
    }
  }, [pathname, router]);

  const endTour = useCallback((completed: boolean) => {
    const current = stateRef.current;
    if (!current) return;
    storage.set('local', seenKey(current.tourId), '1');
    setState(null);
    if (!completed) {
      toast({
        title: 'Tour closed',
        description: current.tourId === 'customer'
          ? 'You can replay it any time from your profile.'
          : 'You can replay it from the admin sidebar.',
      });
    }
  }, []);

  const startTour = useCallback((tourId: TourId) => {
    const first = TOURS[tourId].findIndex(isReachable);
    goTo(tourId, first === -1 ? 0 : first);
  }, [goTo, isReachable]);

  const next = useCallback(() => {
    const current = stateRef.current;
    if (!current) return;
    const steps = TOURS[current.tourId];
    let j = current.index + 1;
    while (j < steps.length && !isReachable(steps[j])) j++;
    if (j >= steps.length) endTour(true);
    else goTo(current.tourId, j);
  }, [endTour, goTo, isReachable]);

  const prevIndex = useMemo(() => {
    if (!state) return -1;
    const steps = TOURS[state.tourId];
    let j = state.index - 1;
    while (j >= 0 && !isReachable(steps[j])) j--;
    return j;
  }, [state, isReachable]);

  const back = useCallback(() => {
    const current = stateRef.current;
    if (current && prevIndex >= 0) goTo(current.tourId, prevIndex);
  }, [goTo, prevIndex]);

  const resume = useCallback(() => {
    const current = stateRef.current;
    if (!current) return;
    // Head to the page of the current step (or the nearest earlier one with a fixed URL).
    const steps = TOURS[current.tourId];
    for (let j = current.index; j >= 0; j--) {
      if (steps[j].href && isReachable(steps[j])) return goTo(current.tourId, j);
    }
  }, [goTo, isReachable]);

  // Restore an in-progress tour, or start one requested via ?tour=customer / ?tour=staff.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tour');
    if (isTourId(requested)) {
      setState({ tourId: requested, index: 0 });
    } else {
      try {
        const saved: Partial<TourState> | null = JSON.parse(storage.get('session', PROGRESS_KEY) ?? 'null');
        if (saved && isTourId(saved.tourId) && typeof saved.index === 'number' && TOURS[saved.tourId][saved.index]) {
          setState({ tourId: saved.tourId, index: saved.index });
        }
      } catch {
        // Ignore corrupt saved progress.
      }
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (restored) storage.set('session', PROGRESS_KEY, state ? JSON.stringify(state) : null);
  }, [state, restored]);

  // Auto-start once for first-time customers on the menu. Not on /login: there
  // the tour is opt-in through "Want to test?", so the page stays uncluttered.
  useEffect(() => {
    if (!restored || isUserLoading || stateRef.current) return;
    if (pathname === '/menu' && !storage.get('local', seenKey('customer'))) {
      setState({ tourId: 'customer', index: 0 });
    } else if (pathname.startsWith('/admin') && userProfile?.role === 'admin' && !storage.get('local', seenKey('staff'))) {
      setState({ tourId: 'staff', index: 0 });
    }
  }, [restored, isUserLoading, pathname, userProfile]);

  // Keep the tour on the visitor's page: if they navigate on their own (or get
  // redirected, e.g. after signing in), jump to the step for where they are —
  // the next one ahead if there is one, otherwise the closest one behind.
  useEffect(() => {
    const current = stateRef.current;
    if (!current) return;
    if (leavingPathRef.current === pathname) return; // tour-initiated navigation still in flight
    leavingPathRef.current = null;

    const steps = TOURS[current.tourId];
    if (matchesPath(steps[current.index], pathname)) return;

    let target = steps.findIndex((s, i) => i > current.index && matchesPath(s, pathname));
    if (target === -1) {
      for (let i = current.index - 1; i >= 0; i--) {
        if (matchesPath(steps[i], pathname)) {
          target = i;
          break;
        }
      }
    }
    if (target !== -1) setState({ ...current, index: target });
    // Deliberately not re-run on index changes — only when the page or the tour changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, state?.tourId]);

  const step = state ? TOURS[state.tourId][state.index] : null;
  const onStepPage = !!step && matchesPath(step, pathname);

  useEffect(() => {
    setPaused(false);
    if (!step || onStepPage) return;
    const timer = setTimeout(() => setPaused(true), PAUSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [step, onStepPage]);

  const value = useMemo(() => ({ startTour, activeTour: state?.tourId ?? null }), [startTour, state?.tourId]);

  const ctx = { isDemo: IS_DEMO };
  const mainSteps = state ? TOURS[state.tourId].filter((s) => !s.optional) : [];

  return (
    <>
      {/* children stays the Provider's only child — Next passes it as a list, and nesting
          it alongside siblings trips React's missing-key warning. */}
      <TourContext.Provider value={value}>{children}</TourContext.Provider>
      {step && onStepPage && (
        <TourCard
          key={`${state!.tourId}:${step.id}`}
          step={step}
          title={step.title}
          body={resolveCopy(step.body, ctx)}
          fallback={step.fallback ? resolveCopy(step.fallback, ctx) : null}
          stepNumber={step.optional ? null : mainSteps.indexOf(step) + 1}
          totalSteps={mainSteps.length}
          canGoBack={prevIndex >= 0}
          onNext={next}
          onBack={back}
          onClose={() => endTour(false)}
        />
      )}
      {step && !onStepPage && paused && (
        <TourPausedPill onResume={resume} onClose={() => endTour(false)} />
      )}
    </>
  );
}

export const useTour = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};
