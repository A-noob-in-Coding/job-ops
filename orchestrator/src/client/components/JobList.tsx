/**
 * Job list with filtering tabs.
 */

import React, { useMemo, useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Job, JobStatus } from "../../shared/types";
import { JobCard } from "./JobCard";

interface JobListProps {
  jobs: Job[];
  onApply: (id: string) => void;
  onReject: (id: string) => void;
  onProcess: (id: string) => void;
  onProcessAll: () => void;
  processingJobId: string | null;
  isProcessingAll: boolean;
}

type FilterTab = "ready" | "discovered" | "applied" | "all";

const tabs: Array<{ id: FilterTab; label: string; statuses: JobStatus[] }> = [
  { id: "ready", label: "Ready", statuses: ["ready"] },
  { id: "discovered", label: "Discovered", statuses: ["discovered", "processing"] },
  { id: "applied", label: "Applied", statuses: ["applied"] },
  { id: "all", label: "All Jobs", statuses: [] },
];

const emptyStateCopy: Record<FilterTab, string> = {
  ready: "Run the pipeline to discover and process new jobs.",
  discovered: "All discovered jobs have been processed.",
  applied: "You haven't applied to any jobs yet.",
  all: "No jobs in the system yet. Run the pipeline to get started!",
};

export const JobList: React.FC<JobListProps> = ({
  jobs,
  onApply,
  onReject,
  onProcess,
  onProcessAll,
  processingJobId,
  isProcessingAll,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>("ready");

  const counts = useMemo(() => {
    const byTab: Record<FilterTab, number> = {
      ready: 0,
      discovered: 0,
      applied: 0,
      all: jobs.length,
    };

    for (const job of jobs) {
      if (job.status === "ready") byTab.ready += 1;
      if (job.status === "applied") byTab.applied += 1;
      if (job.status === "discovered" || job.status === "processing") byTab.discovered += 1;
    }

    return byTab;
  }, [jobs]);

  const jobsForTab = useMemo(() => {
    const map = new Map<FilterTab, Job[]>();

    for (const tab of tabs) {
      if (tab.statuses.length === 0) {
        map.set(tab.id, jobs);
      } else {
        map.set(tab.id, jobs.filter((job) => tab.statuses.includes(job.status)));
      }
    }

    return map;
  }, [jobs]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as FilterTab)}
      className="space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList className="w-full sm:w-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex-1 sm:flex-none">
              {tab.label}
              <span className="ml-2 text-xs tabular-nums text-muted-foreground">
                ({counts[tab.id]})
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {activeTab === "discovered" && counts.discovered > 0 && (
          <Button onClick={onProcessAll} disabled={isProcessingAll} size="sm">
            {isProcessingAll ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Process All ({counts.discovered})
              </>
            )}
          </Button>
        )}
      </div>

      {tabs.map((tab) => {
        const filteredJobs = jobsForTab.get(tab.id) ?? [];

        return (
          <TabsContent key={tab.id} value={tab.id} className="space-y-4">
            {filteredJobs.length === 0 ? (
              <Card className="border-dashed bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <div className="text-base font-semibold">No jobs found</div>
                  <p className="max-w-xl text-sm text-muted-foreground">{emptyStateCopy[tab.id]}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onApply={onApply}
                    onReject={onReject}
                    onProcess={onProcess}
                    isProcessing={processingJobId === job.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
};

