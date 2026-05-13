import {
  Cpu,
  Factory,
  Microscope,
  Orbit,
  Radar,
  Satellite,
  Zap,
  type LucideIcon
} from "lucide-react";
import type { HomepageVisualKind } from "@/lib/seed-homepage";

const visualIcons: Record<HomepageVisualKind, LucideIcon> = {
  chip: Cpu,
  orbit: Satellite,
  robotics: Radar,
  energy: Zap,
  materials: Factory,
  sensing: Microscope
};

export function FallbackVisual({
  kind,
  label
}: {
  kind: HomepageVisualKind;
  label: string;
}) {
  const Icon = visualIcons[kind] ?? Orbit;

  return (
    <div
      role="img"
      aria-label={label}
      className="relative flex h-36 w-full items-center justify-center overflow-hidden border-b border-black bg-ink text-deepOrange"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,90,0,0.38)_0_1px,transparent_1px_14px)]" />
      <div className="absolute left-4 top-4 h-10 w-10 border border-deepOrange/70" />
      <div className="absolute bottom-4 right-4 h-14 w-14 border border-white/30" />
      <div className="relative flex h-20 w-20 items-center justify-center border border-deepOrange bg-black shadow-[5px_5px_0_#ff5a00]">
        <Icon size={36} strokeWidth={2.2} aria-hidden="true" />
      </div>
    </div>
  );
}
