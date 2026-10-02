import type { AperturePublication } from "@deeptechly/aperture";
import { PageShell } from "@/components/layout/PageShell";
import { ApertureArchive } from "./ApertureArchive";
import { ApertureNav } from "./ApertureNav";
import { AperturePageHeader } from "./AperturePageHeader";

export function ApertureArchivePage({
  active,
  eyebrow,
  title,
  description,
  items,
  emptyTitle,
  emptyBody
}: {
  active: string;
  eyebrow: string;
  title: string;
  description: string;
  items: AperturePublication[];
  emptyTitle: string;
  emptyBody: string;
}) {
  return (
    <PageShell hideSectorNav>
      <AperturePageHeader eyebrow={eyebrow} title={title} description={description} />
      <ApertureNav active={active} />
      <section className="bg-paper">
        <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 lg:px-8">
          <ApertureArchive items={items} emptyTitle={emptyTitle} emptyBody={emptyBody} />
        </div>
      </section>
    </PageShell>
  );
}
