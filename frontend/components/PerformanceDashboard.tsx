import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Download, RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import performanceMonitor from "@/lib/performance";

export default function PerformanceDashboard({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState<any>({});
  const [navigationTiming, setNavigationTiming] = useState<any>(null);

  const refreshStats = () => {
    setStats(performanceMonitor.getAllStats());
    setNavigationTiming(performanceMonitor.getNavigationTiming());
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleExport = () => {
    const data = performanceMonitor.exportMetrics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    performanceMonitor.clearMetrics();
    refreshStats();
  };

  const formatMs = (ms: number) => {
    if (ms === 0) return 'N/A';
    return `${ms.toFixed(0)}ms`;
  };

  const getPerformanceIndicator = (value: number, thresholds: { good: number; ok: number }) => {
    if (value === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (value <= thresholds.good) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value <= thresholds.ok) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const metricConfig = {
    'time-to-first-message': { name: 'Time to First Message', thresholds: { good: 500, ok: 1000 } },
    'chat-load-time': { name: 'Chat Load Time', thresholds: { good: 300, ok: 800 } },
    'message-send-latency': { name: 'Message Send Latency', thresholds: { good: 200, ok: 500 } },
    'message-list-render': { name: 'Message List Render', thresholds: { good: 100, ok: 300 } },
    'chat-switch-time': { name: 'Chat Switch Time', thresholds: { good: 200, ok: 500 } },
    'image-load-time': { name: 'Image Load Time', thresholds: { good: 500, ok: 1500 } },
    'search-latency': { name: 'Search Latency', thresholds: { good: 300, ok: 800 } },
    'status-load-time': { name: 'Status Load Time', thresholds: { good: 400, ok: 1000 } },
    'typing-indicator-delay': { name: 'Typing Indicator Delay', thresholds: { good: 50, ok: 150 } },
    'connection-time': { name: 'Connection Time', thresholds: { good: 200, ok: 500 } },
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="border-b px-4 py-4 flex items-center justify-between bg-card">
        <div>
          <h2 className="text-xl font-bold">Performance Monitor</h2>
          <p className="text-sm text-muted-foreground">Real-time application metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {navigationTiming && (
            <Card>
              <CardHeader>
                <CardTitle>Navigation Timing</CardTitle>
                <CardDescription>Initial page load performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">DNS Lookup</div>
                    <div className="text-2xl font-bold">{formatMs(navigationTiming.dns)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">TCP Connection</div>
                    <div className="text-2xl font-bold">{formatMs(navigationTiming.tcp)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Request</div>
                    <div className="text-2xl font-bold">{formatMs(navigationTiming.request)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Response</div>
                    <div className="text-2xl font-bold">{formatMs(navigationTiming.response)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">DOM Processing</div>
                    <div className="text-2xl font-bold">{formatMs(navigationTiming.domProcessing)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">DOM Content Loaded</div>
                    <div className="text-2xl font-bold">{formatMs(navigationTiming.domContentLoaded)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Load Event</div>
                    <div className="text-2xl font-bold">{formatMs(navigationTiming.load)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-2xl font-bold">{formatMs(navigationTiming.total)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>User Interaction Metrics</CardTitle>
              <CardDescription>Performance of critical user interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metricConfig).map(([key, config]: [string, any]) => {
                  const stat = stats[key];
                  if (!stat || stat.count === 0) return null;

                  return (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{config.name}</h3>
                          {getPerformanceIndicator(stat.avg, config.thresholds)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {stat.count} sample{stat.count !== 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground">Average</div>
                          <div className="text-lg font-bold">{formatMs(stat.avg)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Min</div>
                          <div className="text-lg font-semibold">{formatMs(stat.min)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Max</div>
                          <div className="text-lg font-semibold">{formatMs(stat.max)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">P50</div>
                          <div className="text-lg font-semibold">{formatMs(stat.p50)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">P95</div>
                          <div className="text-lg font-semibold">{formatMs(stat.p95)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">P99</div>
                          <div className="text-lg font-semibold">{formatMs(stat.p99)}</div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            Good: ≤ {config.thresholds.good}ms
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            OK: ≤ {config.thresholds.ok}ms
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            Slow: &gt; {config.thresholds.ok}ms
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {Object.values(stats).every((stat: any) => stat.count === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  No performance data collected yet. Use the application to generate metrics.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button variant="outline" onClick={handleClear}>
              Clear All Metrics
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
