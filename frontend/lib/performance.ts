type MetricType = 
  | 'time-to-first-message'
  | 'chat-load-time'
  | 'message-send-latency'
  | 'message-list-render'
  | 'chat-switch-time'
  | 'image-load-time'
  | 'search-latency'
  | 'status-load-time'
  | 'typing-indicator-delay'
  | 'connection-time';

interface PerformanceMetric {
  name: MetricType;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceConfig {
  enableConsoleLogging?: boolean;
  enableRemoteLogging?: boolean;
  remoteEndpoint?: string;
  sampleRate?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private config: PerformanceConfig;
  private marks = new Map<string, number>();
  private maxStoredMetrics = 1000;

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableRemoteLogging: false,
      sampleRate: 1.0,
      ...config,
    };

    this.setupPerformanceObserver();
  }

  private setupPerformanceObserver() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('connection-time', navEntry.responseEnd - navEntry.requestStart, {
              type: 'navigation',
              dns: navEntry.domainLookupEnd - navEntry.domainLookupStart,
              tcp: navEntry.connectEnd - navEntry.connectStart,
            });
          }
        }
      });

      observer.observe({ entryTypes: ['navigation', 'resource'] });
    } catch (e) {
      console.warn('Performance observer not supported:', e);
    }
  }

  startMark(label: string): void {
    if (Math.random() > this.config.sampleRate!) return;

    const now = performance.now();
    this.marks.set(label, now);

    if (performance.mark) {
      performance.mark(`${label}-start`);
    }
  }

  endMark(label: string, metricName: MetricType, metadata?: Record<string, any>): number | null {
    const startTime = this.marks.get(label);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    this.marks.delete(label);

    if (performance.mark && performance.measure) {
      try {
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
      } catch (e) {
        // Ignore if marks don't exist
      }
    }

    this.recordMetric(metricName, duration, metadata);
    return duration;
  }

  recordMetric(name: MetricType, value: number, metadata?: Record<string, any>): void {
    if (Math.random() > this.config.sampleRate!) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics.shift();
    }

    if (this.config.enableConsoleLogging) {
      console.log(
        `[Performance] ${name}: ${value.toFixed(2)}ms`,
        metadata ? metadata : ''
      );
    }

    if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
      this.sendMetricToRemote(metric);
    }
  }

  private async sendMetricToRemote(metric: PerformanceMetric): Promise<void> {
    try {
      await fetch(this.config.remoteEndpoint!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
        keepalive: true,
      });
    } catch (e) {
      console.error('Failed to send metric to remote endpoint:', e);
    }
  }

  getMetrics(name?: MetricType): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter((m) => m.name === name);
    }
    return [...this.metrics];
  }

  getAverageMetric(name: MetricType): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;

    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  getPercentile(name: MetricType, percentile: number): number {
    const metrics = this.getMetrics(name).map((m) => m.value).sort((a, b) => a - b);
    if (metrics.length === 0) return 0;

    const index = Math.ceil((percentile / 100) * metrics.length) - 1;
    return metrics[Math.max(0, index)];
  }

  getStats(name: MetricType) {
    const metrics = this.getMetrics(name).map((m) => m.value);
    if (metrics.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...metrics].sort((a, b) => a - b);
    const sum = metrics.reduce((acc, v) => acc + v, 0);

    return {
      count: metrics.length,
      avg: sum / metrics.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: this.getPercentile(name, 50),
      p95: this.getPercentile(name, 95),
      p99: this.getPercentile(name, 99),
    };
  }

  getAllStats() {
    const metricTypes: MetricType[] = [
      'time-to-first-message',
      'chat-load-time',
      'message-send-latency',
      'message-list-render',
      'chat-switch-time',
      'image-load-time',
      'search-latency',
      'status-load-time',
      'typing-indicator-delay',
      'connection-time',
    ];

    return metricTypes.reduce((acc, name) => {
      acc[name] = this.getStats(name);
      return acc;
    }, {} as Record<MetricType, ReturnType<typeof this.getStats>>);
  }

  clearMetrics(name?: MetricType): void {
    if (name) {
      this.metrics = this.metrics.filter((m) => m.name !== name);
    } else {
      this.metrics = [];
    }
  }

  exportMetrics(): string {
    return JSON.stringify({
      timestamp: Date.now(),
      metrics: this.metrics,
      stats: this.getAllStats(),
    }, null, 2);
  }

  getNavigationTiming() {
    if (typeof window === 'undefined' || !performance.getEntriesByType) return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return null;

    return {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
      domProcessing: navigation.domComplete - navigation.domInteractive,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      load: navigation.loadEventEnd - navigation.loadEventStart,
      total: navigation.loadEventEnd - navigation.fetchStart,
    };
  }

  getResourceTiming(resourceUrl: string) {
    if (typeof window === 'undefined' || !performance.getEntriesByType) return null;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const resource = resources.find((r) => r.name.includes(resourceUrl));
    
    if (!resource) return null;

    return {
      duration: resource.duration,
      size: resource.transferSize,
      cached: resource.transferSize === 0,
    };
  }
}

export const performanceMonitor = new PerformanceMonitor({
  enableConsoleLogging: import.meta.env.DEV,
  enableRemoteLogging: false,
  sampleRate: 1.0,
});

export const usePerformanceTracking = () => {
  const trackChatLoad = (chatId: string) => {
    performanceMonitor.startMark(`chat-load-${chatId}`);
    
    return () => {
      performanceMonitor.endMark(`chat-load-${chatId}`, 'chat-load-time', { chatId });
    };
  };

  const trackMessageSend = (messageId: string) => {
    performanceMonitor.startMark(`message-send-${messageId}`);
    
    return () => {
      performanceMonitor.endMark(`message-send-${messageId}`, 'message-send-latency', { messageId });
    };
  };

  const trackFirstMessage = (chatId: string) => {
    performanceMonitor.startMark(`first-message-${chatId}`);
    
    return () => {
      performanceMonitor.endMark(`first-message-${chatId}`, 'time-to-first-message', { chatId });
    };
  };

  const trackMessageListRender = (messageCount: number) => {
    performanceMonitor.startMark('message-list-render');
    
    return () => {
      performanceMonitor.endMark('message-list-render', 'message-list-render', { messageCount });
    };
  };

  const trackChatSwitch = (fromChatId: string, toChatId: string) => {
    performanceMonitor.startMark('chat-switch');
    
    return () => {
      performanceMonitor.endMark('chat-switch', 'chat-switch-time', { fromChatId, toChatId });
    };
  };

  const trackImageLoad = (imageUrl: string) => {
    performanceMonitor.startMark(`image-load-${imageUrl}`);
    
    return () => {
      performanceMonitor.endMark(`image-load-${imageUrl}`, 'image-load-time', { imageUrl });
    };
  };

  const trackSearch = (query: string) => {
    performanceMonitor.startMark('search');
    
    return () => {
      performanceMonitor.endMark('search', 'search-latency', { query });
    };
  };

  return {
    trackChatLoad,
    trackMessageSend,
    trackFirstMessage,
    trackMessageListRender,
    trackChatSwitch,
    trackImageLoad,
    trackSearch,
    recordMetric: performanceMonitor.recordMetric.bind(performanceMonitor),
    getStats: performanceMonitor.getStats.bind(performanceMonitor),
    getAllStats: performanceMonitor.getAllStats.bind(performanceMonitor),
  };
};

export default performanceMonitor;
