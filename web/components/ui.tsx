import type { ReactNode, CSSProperties } from "react";

const CLIP = "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)";

export function Panel({ children, className = "", border = "rgba(255,255,255,0.10)" }: { children: ReactNode; className?: string; border?: string }) {
  const clip: CSSProperties = { clipPath: CLIP };
  return (
    <div className="h-full p-px" style={{ ...clip, background: border }}>
      <div className={`h-full bg-[#0c0e12] ${className}`} style={clip}>
        {children}
      </div>
    </div>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500 ${className}`}>{children}</div>;
}

export function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
    </span>
  );
}

export function Pill({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400 ${className}`}>
      {children}
    </span>
  );
}

export function SectionHead({ eyebrow, title, lead }: { eyebrow: string; title: ReactNode; lead?: string }) {
  return (
    <div className="mb-12 flex flex-col gap-4">
      <Pill>{eyebrow}</Pill>
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {lead ? <p className="max-w-2xl text-[15px] leading-relaxed text-neutral-400 sm:text-base">{lead}</p> : null}
    </div>
  );
}
