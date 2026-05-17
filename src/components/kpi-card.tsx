import type { LucideIcon } from "lucide-react";

type KpiCardProps = {
  title: string;
  value: string;
  caption: string;
  icon: LucideIcon;
};

export function KpiCard({ title, value, caption, icon: Icon }: KpiCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">{value}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-md bg-cyan-50 text-cyan-700">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">{caption}</p>
    </article>
  );
}
