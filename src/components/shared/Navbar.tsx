import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  return (
    <header className="border-b border-border bg-card">
      <nav className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/eyes.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7"
            unoptimized
          />
          <span className="text-lg font-bold tracking-tight text-foreground">
            TFT <span className="text-accent">Doctor</span>
          </span>
        </Link>
      </nav>
    </header>
  );
}
