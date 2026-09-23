'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Compass, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TourStep } from './tour-steps';

const SPOTLIGHT_PAD = 8;
const EDGE = 16;
const GAP = 12;
const MAX_CARD_WIDTH = 360;
// How long to wait for a step's target before showing its fallback copy.
const TARGET_TIMEOUT_MS = 2500;

function findVisible(selectors: string[]): Element | null {
  for (const selector of selectors) {
    for (const node of document.querySelectorAll(selector)) {
      const r = node.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) return node;
    }
  }
  return null;
}

/**
 * Tracks the on-screen box of the step's target. Polls every frame so the
 * spotlight follows scrolling, layout shifts and content that loads late
 * (e.g. menu cards replacing skeletons).
 */
function useTargetRect(step: TourStep, reduceMotion: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setRect(null);
    setMissing(false);
    if (!step.target) return;

    const selectors = step.target;
    const startedAt = performance.now();
    let el: Element | null = null;
    let lastKey = '';
    let scrolled = false;
    let gaveUp = false;
    let frame = 0;

    const tick = () => {
      if (!el || !el.isConnected) {
        el = findVisible(selectors);
        if (el && !scrolled) {
          scrolled = true;
          el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      }

      const r = el?.getBoundingClientRect();
      if (r && r.width > 0 && r.height > 0) {
        const key = `${r.top}|${r.left}|${r.width}|${r.height}`;
        if (key !== lastKey) {
          lastKey = key;
          setRect(r);
          if (gaveUp) {
            gaveUp = false;
            setMissing(false);
          }
        }
      } else {
        el = null;
        if (lastKey !== 'none') {
          lastKey = 'none';
          setRect(null);
        }
        if (!gaveUp && performance.now() - startedAt > TARGET_TIMEOUT_MS) {
          gaveUp = true;
          setMissing(true);
        }
      }
      frame = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(frame);
  }, [step, reduceMotion]);

  return { rect, missing };
}

function useViewport() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return size;
}

function placeCard(rect: DOMRect | null, vw: number, vh: number, width: number, height: number) {
  if (!rect) {
    return { top: Math.max(EDGE, (vh - height) / 2), left: (vw - width) / 2 };
  }

  const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, EDGE), vw - width - EDGE);
  const below = rect.bottom + SPOTLIGHT_PAD + GAP;
  const above = rect.top - SPOTLIGHT_PAD - GAP - height;

  if (below + height <= vh - EDGE) return { top: below, left };
  if (above >= EDGE) return { top: above, left };

  // Tall targets (sidebars, panels): sit beside them when there's room, as on desktop.
  const sideTop = Math.min(Math.max(rect.top, EDGE), vh - height - EDGE);
  const right = rect.right + SPOTLIGHT_PAD + GAP;
  if (right + width <= vw - EDGE) return { top: sideTop, left: right };
  const leftSide = rect.left - SPOTLIGHT_PAD - GAP - width;
  if (leftSide >= EDGE) return { top: sideTop, left: leftSide };

  // No room anywhere — pin the card to whichever edge the target covers less.
  const targetCenter = rect.top + rect.height / 2;
  return { top: targetCenter > vh / 2 ? EDGE : vh - height - EDGE, left };
}

interface TourCardProps {
  step: TourStep;
  title: string;
  body: string;
  fallback: string | null;
  /** 1-based position among the main steps, or null for an optional extra tip. */
  stepNumber: number | null;
  totalSteps: number;
  canGoBack: boolean;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export function TourCard({
  step, title, body, fallback, stepNumber, totalSteps, canGoBack, onNext, onBack, onClose,
}: TourCardProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const { rect, missing } = useTargetRect(step, reduceMotion);
  const { width: vw, height: vh } = useViewport();
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(220);

  const waitingForTarget = !!step.target && !rect && !missing;
  const text = missing && fallback ? fallback : body;

  useLayoutEffect(() => {
    const h = cardRef.current?.offsetHeight;
    if (h && h !== cardHeight) setCardHeight(h);
  });

  // Move focus into the card when it changes, unless the visitor is typing somewhere.
  useEffect(() => {
    const active = document.activeElement;
    if (!active || active === document.body || cardRef.current?.contains(active)) {
      cardRef.current?.focus({ preventScroll: true });
    }
  }, [step.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && !step.waitFor) onNext();
      else if (e.key === 'ArrowLeft' && canGoBack) onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step.waitFor, canGoBack, onNext, onBack, onClose]);

  if (!vw || waitingForTarget) return null;

  const cardWidth = Math.min(MAX_CARD_WIDTH, vw - EDGE * 2);
  const { top, left } = placeCard(rect, vw, vh, cardWidth, cardHeight);
  const progress = stepNumber ? (stepNumber / totalSteps) * 100 : null;

  return (
    <>
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[200] rounded-xl"
          style={{
            top: rect.top - SPOTLIGHT_PAD,
            left: rect.left - SPOTLIGHT_PAD,
            width: rect.width + SPOTLIGHT_PAD * 2,
            height: rect.height + SPOTLIGHT_PAD * 2,
            boxShadow: '0 0 0 2px hsl(var(--primary)), 0 0 0 9999px rgb(0 0 0 / 0.55)',
          }}
        />
      ) : (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[200] bg-black/55" />
      )}

      <motion.div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
        initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="fixed z-[210] rounded-2xl border bg-popover p-5 text-popover-foreground shadow-2xl outline-none"
        style={{ top, left, width: cardWidth }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {stepNumber ? `Step ${stepNumber} of ${totalSteps}` : 'Extra tip'}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tour"
            className="-mr-2 -mt-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {progress !== null && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}

        <h2 id="tour-title" className="mt-3 text-lg font-bold leading-snug">{title}</h2>
        <p id="tour-body" className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" onClick={onClose}>
            Skip tour
          </Button>
          <div className="flex items-center gap-2">
            {canGoBack && (
              <Button variant="outline" size="sm" onClick={onBack} aria-label="Previous step">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {step.waitFor ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {step.waitFor}
              </span>
            ) : (
              <Button size="sm" onClick={onNext}>
                {step.nextLabel ?? 'Next'}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        </motion.div>
    </>
  );
}

/** Shown when the visitor wanders to a page the tour has no step for. */
export function TourPausedPill({ onResume, onClose }: { onResume: () => void; onClose: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[210] flex justify-center px-4">
      <div
        role="status"
        className="pointer-events-auto flex items-center gap-1 rounded-full border bg-popover py-1 pl-4 pr-1 text-sm text-popover-foreground shadow-lg"
      >
        <Compass className="mr-1 h-4 w-4 text-primary" />
        <span className="font-medium">Tour paused</span>
        <Button size="sm" variant="ghost" className="h-8 rounded-full font-semibold text-primary" onClick={onResume}>
          Resume
        </Button>
        <button
          type="button"
          onClick={onClose}
          aria-label="End tour"
          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
