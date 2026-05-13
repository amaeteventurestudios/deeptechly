export function HomeTag({
  children,
  dark = false
}: {
  children: string;
  dark?: boolean;
}) {
  return (
    <span
      className={`inline-flex min-h-8 max-w-full items-center justify-center border px-2.5 py-1 text-center text-[10px] font-black uppercase tracking-[0.12em] ${
        dark
          ? "border-white/25 bg-ink text-white"
          : "border-black bg-white text-ink"
      }`}
    >
      {children}
    </span>
  );
}
