import { JobDashboard } from "@/components/job-dashboard";
import { SourceRoadmap } from "@/components/source-roadmap";

export default function HomePage() {
  return (
    <main className="pb-10 pt-8">
      <JobDashboard />
      <SourceRoadmap />
    </main>
  );
}
