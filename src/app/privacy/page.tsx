import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — TFT Doctor",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <article className="prose prose-invert prose-sm max-w-none">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: March 21, 2026</p>

        <p>
          TFT Doctor (<strong>tftdoctor.gg</strong>) is committed to protecting
          your privacy. This Privacy Policy explains what data we collect, how
          we use it, and your rights.
        </p>

        <h2>1. Data We Collect</h2>

        <h3>1.1 Data You Provide</h3>
        <p>
          When you use the advisor tool, you input game state information
          (augments, emblems, items, artifacts). This data is used solely to
          generate recommendations and is <strong>not stored</strong> on our
          servers. It is processed in-memory and discarded after your request
          completes.
        </p>

        <h3>1.2 Publicly Available Match Data</h3>
        <p>
          We collect publicly available match data from Riot Games' official API.
          This includes:
        </p>
        <ul>
          <li>
            Match results (team compositions, placements, items, traits) from
            high-ranked players (Challenger, Grandmaster, Master)
          </li>
          <li>
            Player identifiers (encrypted PUUIDs) for match discovery purposes
            only
          </li>
        </ul>
        <p>
          This data is public, provided by Riot Games' official API, and is used
          exclusively for generating aggregate statistics. We do not display
          individual player data or match histories.
        </p>

        <h3>1.3 Automatically Collected Data</h3>
        <p>
          When you visit our site, we may automatically collect:
        </p>
        <ul>
          <li>
            IP address (for security and abuse prevention; not linked to your
            identity)
          </li>
          <li>
            Browser type, device type, and operating system
          </li>
          <li>
            Pages visited and time spent on site
          </li>
          <li>
            Referral source (how you found our site)
          </li>
        </ul>
        <p>
          This data is collected through standard web server logs and, if
          enabled, through analytics services.
        </p>

        <h3>1.4 Cookies & Advertising</h3>
        <p>
          We use cookies for basic site functionality. If advertising is enabled
          (e.g., Google AdSense), third-party advertising partners may use
          cookies and similar technologies to serve relevant ads. You can manage
          cookie preferences through your browser settings.
        </p>

        <h2>2. How We Use Your Data</h2>
        <ul>
          <li>
            <strong>Recommendations:</strong> Your game state input is processed
            in real-time to generate personalized comp recommendations. It is not
            stored.
          </li>
          <li>
            <strong>Match data:</strong> Aggregated into statistical models
            (average placements, win rates, item performance) to power our
            recommendation engine. Individual match records are deleted after
            aggregation.
          </li>
          <li>
            <strong>Analytics:</strong> To understand how users interact with the
            site and improve the service.
          </li>
          <li>
            <strong>Advertising:</strong> To display relevant advertisements
            that support the free service.
          </li>
        </ul>

        <h2>3. Data Sharing</h2>
        <p>
          We do not sell your personal data. We may share data with:
        </p>
        <ul>
          <li>
            <strong>Advertising partners</strong> (e.g., Google AdSense) who may
            use cookies for ad personalization
          </li>
          <li>
            <strong>Hosting providers</strong> (Vercel, Supabase) who process
            data on our behalf under their privacy policies
          </li>
          <li>
            <strong>Law enforcement</strong> if required by law or to protect
            our rights
          </li>
        </ul>

        <h2>4. Data Retention</h2>
        <ul>
          <li>
            <strong>User input:</strong> Not stored. Processed in-memory only.
          </li>
          <li>
            <strong>Raw match data:</strong> Retained for up to 3 days, then
            deleted after aggregation.
          </li>
          <li>
            <strong>Aggregated statistics:</strong> Retained for the duration of
            the current game patch (approximately 2 weeks), then replaced by
            new data.
          </li>
          <li>
            <strong>Server logs:</strong> Retained for up to 30 days.
          </li>
        </ul>

        <h2>5. Your Rights (GDPR / CCPA)</h2>
        <p>
          If you are located in the European Union, United Kingdom, or
          California, you have the following rights:
        </p>
        <ul>
          <li>
            <strong>Access:</strong> Request a copy of any personal data we hold
            about you.
          </li>
          <li>
            <strong>Deletion:</strong> Request deletion of your personal data.
          </li>
          <li>
            <strong>Objection:</strong> Object to processing of your data for
            advertising purposes.
          </li>
          <li>
            <strong>Portability:</strong> Request your data in a machine-readable
            format.
          </li>
        </ul>
        <p>
          Since we do not collect personal accounts or store user input, most of
          these rights apply only to server log data. To exercise any of these
          rights, contact us at the email below.
        </p>

        <h2>6. Children's Privacy</h2>
        <p>
          TFT Doctor is not directed at children under 13. We do not knowingly
          collect personal information from children under 13. If you believe a
          child has provided us with personal data, please contact us.
        </p>

        <h2>7. Third-Party Services</h2>
        <p>
          Our site uses the following third-party services, each with their own
          privacy policies:
        </p>
        <ul>
          <li>
            <strong>Riot Games API</strong> — for match data (
            <a
              href="https://developer.riotgames.com/policies/general"
              className="text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Riot Developer Policy
            </a>
            )
          </li>
          <li>
            <strong>Vercel</strong> — hosting (
            <a
              href="https://vercel.com/legal/privacy-policy"
              className="text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Vercel Privacy Policy
            </a>
            )
          </li>
          <li>
            <strong>Supabase</strong> — database (
            <a
              href="https://supabase.com/privacy"
              className="text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Supabase Privacy Policy
            </a>
            )
          </li>
        </ul>

        <h2>8. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be
          posted on this page with an updated "Last updated" date.
        </p>

        <h2>9. Contact</h2>
        <p>
          For privacy-related questions or requests, contact us at{" "}
          <a href="mailto:contact@tftdoctor.gg" className="text-primary">
            contact@tftdoctor.gg
          </a>
          .
        </p>
      </article>
    </div>
  );
}
