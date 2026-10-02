import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ApertureNav } from "@/components/aperture/ApertureNav";
import { ProblemBrief } from "@/components/aperture/ApertureBrief";
import { PageShell } from "@/components/layout/PageShell";
import { getPublicProblem } from "@/lib/aperture/public-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const problem = await getPublicProblem((await params).slug);
  return problem ? { title: `${problem.title} | Aperture`, description: problem.summary } : {};
}

export default async function ProblemPage({ params }: Props) {
  const problem = await getPublicProblem((await params).slug);
  if (!problem) notFound();
  return <PageShell hideSectorNav><ApertureNav active="problems" /><ProblemBrief problem={problem} /></PageShell>;
}
