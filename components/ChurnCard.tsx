"use client";

export const CHURN_DEMO_URL = "https://tiagoccepp.github.io/churn-predictor-ml/";

export default function ChurnCard() {
  return (
    <a
      href={CHURN_DEMO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open the churn prediction demo in a new tab"
      className="churn-sweep enter enter-4 lift group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-panel px-5 py-4 hover:border-churn/40"
    >
      <div className="min-w-0">
        <h2 className="font-display text-lg font-bold text-churn">Churn prediction</h2>
        <p className="mt-0.5 text-sm text-muted">
          Customer risk scoring lives in its own interactive demo — confusion matrix, thresholds, and
          cohort explorer included.
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-2">
        <span className="font-mono inline-flex items-center gap-1.5 rounded border border-line px-2 py-0.5 text-[0.7rem] tracking-wide text-muted">
          EXTERNAL · LINK
        </span>
        <span className="font-mono rounded-lg border border-churn/40 px-4 py-2 text-[0.75rem] font-semibold text-churn group-hover:bg-churn/10">
          OPEN DEMO ↗
        </span>
      </span>
    </a>
  );
}
