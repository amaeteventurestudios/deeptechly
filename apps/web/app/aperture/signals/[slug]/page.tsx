import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApertureNav } from "@/components/aperture/ApertureNav";
import { SignalBrief } from "@/components/aperture/ApertureBrief";
import { PageShell } from "@/components/layout/PageShell";
import { getPublicSignal } from "@/lib/aperture/public-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const signal = await getPublicSignal((await params).slug);
  return signal ? { title: `${signal.title} | Aperture`, description: signal.summary } : {};
}

export default async function SignalPage({ params }: Props) {
  const signal = await getPublicSignal((await params).slug);
  if (!signal) notFound();
  return <PageShell hideSectorNav><ApertureNav active="signals" /><SignalBrief signal={signal} /></PageShell>;
}
