export function SiteFooter() {
  return (
    <footer className="border-t border-border/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>DTSC 3601 — Iris Analytics dashboard.</p>
        <p>
          Next.js · shadcn/ui · Supabase{" "}
          <span className="text-primary">·</span> deployed on Vercel
        </p>
      </div>
    </footer>
  );
}
