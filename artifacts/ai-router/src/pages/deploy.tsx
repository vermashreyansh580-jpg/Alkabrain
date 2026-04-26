import React, { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getGetDeployConfigQueryOptions, 
  getGetDeployStatusQueryOptions,
  getListDeployHistoryQueryOptions,
  useTriggerDeploy
} from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { Rocket, CheckCircle2, XCircle, Clock, GitCommit, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function Deploy() {
  const queryClient = useQueryClient();
  const [commitMessage, setCommitMessage] = React.useState("");

  const { data: config, isLoading: configLoading } = useQuery(getGetDeployConfigQueryOptions());
  const { data: history } = useQuery(getListDeployHistoryQueryOptions());
  
  const { data: statusData } = useQuery({
    ...getGetDeployStatusQueryOptions(),
    refetchInterval: (query) => {
      const state = query.state.data?.job?.state;
      return (state === 'pending' || state === 'pushing' || state === 'building') ? 2000 : false;
    }
  });

  const triggerDeploy = useTriggerDeploy({
    mutation: {
      onSuccess: () => {
        setCommitMessage("");
        queryClient.invalidateQueries({ queryKey: getGetDeployStatusQueryOptions().queryKey });
        queryClient.invalidateQueries({ queryKey: getListDeployHistoryQueryOptions().queryKey });
      }
    }
  });

  const handleDeploy = () => {
    triggerDeploy.mutate({ data: { commitMessage: commitMessage || undefined } });
  };

  const job = statusData?.job;
  const isDeploying = job?.state === 'pending' || job?.state === 'pushing' || job?.state === 'building';

  return (
    <div className="flex-1 overflow-auto bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-semibold tracking-tight font-serif mb-2">Deployment Console</h1>
          <p className="text-muted-foreground text-lg">
            Push the router brain to a Hugging Face Space for public access.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            
            {config?.hasToken === false && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive-foreground rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-destructive">Missing Hugging Face Token</h4>
                  <p className="text-sm opacity-90 mt-1">
                    You need to set the `HF_TOKEN` secret in Replit Secrets with write access to deploy.
                  </p>
                </div>
              </div>
            )}

            <Card className="border-border/60 bg-card/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Push to Space</CardTitle>
                <CardDescription>
                  Deploying to <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">{config?.spaceRepo || '...'}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Commit Message (Optional)</label>
                  <Input 
                    placeholder="e.g. Update routing prompts" 
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    disabled={isDeploying || triggerDeploy.isPending}
                    className="bg-background"
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t border-border/50 py-4 flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Triggers a fresh build on Hugging Face infrastructure.
                </p>
                <Button 
                  onClick={handleDeploy} 
                  disabled={isDeploying || triggerDeploy.isPending || !config?.hasToken}
                  className="gap-2 px-6"
                >
                  {(isDeploying || triggerDeploy.isPending) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Rocket className="w-4 h-4" />
                  )}
                  {isDeploying ? 'Deploying...' : 'Deploy to Space'}
                </Button>
              </CardFooter>
            </Card>

            {job && (
              <Card className="border-border/60 bg-card shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border/50">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold flex items-center gap-2 text-lg">
                      Live Status
                      {isDeploying && <span className="flex w-2 h-2 rounded-full bg-primary animate-pulse" />}
                    </h3>
                    <Badge variant={job.state === 'success' ? 'default' : job.state === 'failed' ? 'destructive' : 'secondary'} className="capitalize">
                      {job.state}
                    </Badge>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-center text-sm font-medium text-muted-foreground px-1">
                      <div className={`flex flex-col items-center gap-2 ${job.state !== 'pending' ? 'text-primary' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${job.state !== 'pending' ? 'border-primary bg-primary/10' : 'border-muted'}`}>
                          1
                        </div>
                        <span>Prepare</span>
                      </div>
                      <div className={`flex-1 h-0.5 mx-2 ${job.state !== 'pending' ? 'bg-primary' : 'bg-muted'}`} />
                      <div className={`flex flex-col items-center gap-2 ${job.state === 'building' || job.state === 'success' || job.state === 'failed' ? 'text-primary' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${job.state === 'building' || job.state === 'success' || job.state === 'failed' ? 'border-primary bg-primary/10' : 'border-muted'}`}>
                          2
                        </div>
                        <span>Push</span>
                      </div>
                      <div className={`flex-1 h-0.5 mx-2 ${(job.state === 'building' && statusData?.runtimeStage) || job.state === 'success' || job.state === 'failed' ? 'bg-primary' : 'bg-muted'}`} />
                      <div className={`flex flex-col items-center gap-2 ${job.state === 'success' ? 'text-green-500' : job.state === 'failed' ? 'text-destructive' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${job.state === 'success' ? 'border-green-500 bg-green-500/10 text-green-500' : job.state === 'failed' ? 'border-destructive bg-destructive/10 text-destructive' : 'border-muted'}`}>
                          {job.state === 'success' ? <CheckCircle2 className="w-5 h-5" /> : job.state === 'failed' ? <XCircle className="w-5 h-5" /> : '3'}
                        </div>
                        <span>{job.state === 'success' ? 'Ready' : job.state === 'failed' ? 'Failed' : 'Build'}</span>
                      </div>
                    </div>
                  </div>

                  {statusData?.runtimeStage && isDeploying && (
                    <div className="mt-6 text-sm text-center text-muted-foreground animate-pulse">
                      HF Stage: {statusData.runtimeStage}
                    </div>
                  )}

                  {job.state === 'success' && statusData?.spaceUrl && (
                    <div className="mt-8 flex justify-center">
                      <Button variant="outline" asChild className="gap-2">
                        <a href={statusData.spaceUrl} target="_blank" rel="noreferrer">
                          Open Live Space <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
                
                {job.logs && (
                  <div className="bg-sidebar p-4 font-mono text-xs overflow-x-auto max-h-[300px] text-muted-foreground">
                    <pre className="whitespace-pre-wrap">{job.logs}</pre>
                  </div>
                )}
              </Card>
            )}

          </div>

          <div className="space-y-6">
            <Card className="border-border/60 bg-card/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">History</CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <div className="divide-y divide-border/50">
                  {history?.jobs.length === 0 ? (
                    <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                      No deployments yet.
                    </div>
                  ) : (
                    history?.jobs.map((hJob) => (
                      <div key={hJob.id} className="px-6 py-4 flex flex-col gap-2 hover:bg-muted/20 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-sm">
                            {hJob.commitMessage || "Auto-deploy"}
                          </div>
                          <Badge variant={hJob.state === 'success' ? 'default' : hJob.state === 'failed' ? 'destructive' : 'secondary'} className="text-[10px] h-5 px-1.5 py-0 capitalize">
                            {hJob.state}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(hJob.startedAt), { addSuffix: true })}
                          </span>
                          {hJob.commitSha && (
                            <span className="flex items-center gap-1 font-mono">
                              <GitCommit className="w-3 h-3" />
                              {hJob.commitSha.substring(0, 7)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
