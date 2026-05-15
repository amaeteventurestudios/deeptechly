import { SaveResearchButton } from "@/components/saved/SaveResearchButton";

export function HomeSaveButton({
  label,
  className = "",
  href,
  itemId,
  itemType,
  sector,
  entityName
}: {
  label: string;
  className?: string;
  href: string;
  itemId: string;
  itemType: string;
  sector?: string;
  entityName?: string;
}) {
  return (
    <SaveResearchButton
      compact
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center border border-black bg-white text-ink shadow-[3px_3px_0_#0f0f0f] hover:bg-deepOrange focus:outline-none focus:ring-2 focus:ring-deepOrange focus:ring-offset-2 ${className}`}
      entityName={entityName}
      href={href}
      itemId={itemId}
      itemType={itemType}
      sector={sector}
      title={label}
    />
  );
}
