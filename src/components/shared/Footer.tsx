import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-4 text-xs text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
          </div>
          <p className="text-center text-xs text-muted-foreground/60">
            TFT Doctor is not endorsed by Riot Games and does not reflect the
            views or opinions of Riot Games or anyone officially involved in
            producing or managing Riot Games properties. Riot Games and all
            associated properties are trademarks or registered trademarks of
            Riot Games, Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}
