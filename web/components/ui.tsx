import type { ReactNode } from "react";

export const gradientBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#0d9488] font-semibold text-white shadow-lg shadow-teal-900/40 transition-all hover:-translate-y-0.5 hover:bg-[#0f766e] disabled:opacity-60 disabled:hover:translate-y-0";

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass ${className}`}>{children}</div>;
}

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`font-mono text-[11px] uppercase tracking-[0.2em] text-teal-300 ${className}`}>{children}</span>;
}

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-teal-300 ${className}`}>
      {children}
    </span>
  );
}

export function Dot({ className = "" }: { className?: string }) {
  return (
    <span className={`relative flex h-2 w-2 ${className}`}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
    </span>
  );
}
