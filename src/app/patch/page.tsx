import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PatchPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold sm:text-3xl">
          Patch & Data Status
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Current patch information and data collection status.
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-base font-bold">Current Patch</h2>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Version</span>
              <span className="text-sm font-medium text-foreground">16.6</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Set</span>
              <span className="text-sm font-medium text-foreground">
                Set 16
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-base font-bold">Data Status</h2>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Source</span>
              <Badge variant="outline" className="text-xs">
                Mock Data
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pipeline</span>
              <Badge
                variant="outline"
                className="border-warning/30 bg-warning/10 text-xs text-warning"
              >
                Not Connected
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              The data pipeline has not been connected yet. Recommendations are
              currently based on mock data. Connect a Riot API key and set up
              the ingestion pipeline to start using real match data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-base font-bold">Next Steps</h2>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-accent">1.</span>
                Register on the Riot Developer Portal and get an API key
              </li>
              <li className="flex gap-2">
                <span className="text-accent">2.</span>
                Set up Supabase PostgreSQL database
              </li>
              <li className="flex gap-2">
                <span className="text-accent">3.</span>
                Configure the data ingestion pipeline
              </li>
              <li className="flex gap-2">
                <span className="text-accent">4.</span>
                Run the aggregation job to generate real comp stats
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
