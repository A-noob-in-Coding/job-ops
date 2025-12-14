/**
 * Header component with logo and pipeline trigger.
 */

import React from "react";
import { Loader2, Play, RefreshCcw, Rocket, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface HeaderProps {
  onRunPipeline: () => void;
  onRefresh: () => void;
  onClearDatabase: () => void;
  isPipelineRunning: boolean;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onRunPipeline,
  onRefresh,
  onClearDatabase,
  isPipelineRunning,
  isLoading,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Rocket className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Job Ops</div>
            <div className="text-xs text-muted-foreground">Orchestrator</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                title="Clear all jobs from database"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Clear DB</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all jobs?</AlertDialogTitle>
                <AlertDialogDescription>
                  This deletes all jobs from the database. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClearDatabase}>
                  Clear database
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button size="sm" onClick={onRunPipeline} disabled={isPipelineRunning}>
            {isPipelineRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Pipeline
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
