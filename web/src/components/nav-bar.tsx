import Link from "next/link";
import { GitFork, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sprout className="size-4.5" strokeWidth={2.5} />
          </span>
          <span className="text-sm sm:text-base">
            IRIS <span className="text-primary">{"// "}</span>ANALYTICS
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/#about">About</Link>} />
          <Button variant="ghost" size="sm" render={<Link href="/dashboard">Dashboard</Link>} />
          <Button
            variant="outline"
            size="sm"
            className="ml-1"
            render={
              <a href="https://github.com/zcrawfo6/DTSC-3601" target="_blank" rel="noreferrer">
                <GitFork className="size-4" />
                <span className="hidden sm:inline">Source</span>
              </a>
            }
          />
        </nav>
      </div>
    </header>
  );
}
