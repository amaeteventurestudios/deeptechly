export function AperturePageHeader({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="border-b border-black bg-deepOrange deeptech-texture">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-[11px] font-black uppercase tracking-[0.28em]">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl font-serif text-5xl font-black leading-[0.94] tracking-[-0.035em] sm:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-sm font-semibold leading-6 text-ink/82">
          {description}
        </p>
      </div>
    </section>
  );
}
