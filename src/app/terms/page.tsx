import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — TFT Doctor",
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <article className="prose prose-invert prose-sm max-w-none">
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: March 21, 2026</p>

        <p>
          Welcome to TFT Doctor (<strong>tftdoctor.gg</strong>). By accessing or
          using our website, you agree to be bound by these Terms of Service. If
          you do not agree, please do not use the site.
        </p>

        <h2>1. Description of Service</h2>
        <p>
          TFT Doctor is a free web application that provides data-driven team
          composition recommendations for Teamfight Tactics (TFT) by Riot Games.
          The service analyzes publicly available match data from high-ranked
          players to generate statistical insights and personalized
          recommendations based on user-provided game state inputs (augments,
          emblems, items, artifacts).
        </p>

        <h2>2. Eligibility</h2>
        <p>
          You must be at least 13 years of age to use this service. By using TFT
          Doctor, you represent that you meet this requirement.
        </p>

        <h2>3. Free Service & Advertising</h2>
        <p>
          TFT Doctor is provided free of charge. The service is supported by
          advertising. By using the site, you consent to the display of
          advertisements. We may offer optional premium features in the future,
          but core functionality will always remain free.
        </p>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>
            Use the service for any unlawful purpose or in violation of any
            applicable laws
          </li>
          <li>
            Attempt to scrape, crawl, or automatically extract data from the
            site beyond normal usage
          </li>
          <li>
            Interfere with or disrupt the service or servers connected to the
            service
          </li>
          <li>
            Reverse-engineer, decompile, or disassemble any portion of the
            service
          </li>
          <li>
            Use the service to gain an unfair competitive advantage in violation
            of Riot Games&apos; Terms of Service
          </li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <p>
          The statistical analysis, recommendation algorithms, and original
          content on TFT Doctor are the property of TFT Doctor. Teamfight
          Tactics, champion names, item names, and all related game assets are
          trademarks and copyrights of Riot Games, Inc.
        </p>

        <h2>6. Riot Games Disclaimer</h2>
        <p>
          TFT Doctor is not endorsed by Riot Games and does not reflect the
          views or opinions of Riot Games or anyone officially involved in
          producing or managing Riot Games properties. Riot Games and all
          associated properties are trademarks or registered trademarks of Riot
          Games, Inc.
        </p>

        <h2>7. Data Accuracy & Disclaimer</h2>
        <p>
          TFT Doctor provides recommendations based on statistical analysis of
          match data. We do not guarantee the accuracy, completeness, or
          usefulness of any recommendations. Game outcomes depend on many factors
          beyond what our tool can analyze. Use recommendations as one input to
          your decision-making, not as a guarantee of results.
        </p>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
          OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
          IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
          PURPOSE, AND NON-INFRINGEMENT.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          In no event shall TFT Doctor, its operators, or contributors be liable
          for any indirect, incidental, special, consequential, or punitive
          damages, including loss of profits, data, or goodwill, arising out of
          or related to your use of the service.
        </p>

        <h2>9. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms of Service at any time.
          Changes will be posted on this page with an updated &quot;Last updated&quot;
          date. Your continued use of the service after changes constitutes
          acceptance of the revised terms.
        </p>

        <h2>10. Contact</h2>
        <p>
          If you have questions about these Terms of Service, please contact us
          at{" "}
          <a href="mailto:contact@tftdoctor.gg" className="text-accent">
            contact@tftdoctor.gg
          </a>
          .
        </p>
      </article>
    </div>
  );
}
