interface ReconnectionConfig {
  initialDelayMs?: number;
  maxDelayMs?: number;
  maxAttempts?: number;
  backoffMultiplier?: number;
}

interface StreamConnection<T> {
  stream: AsyncIterable<T> | null;
  isConnected: boolean;
  isReconnecting: boolean;
  attemptCount: number;
  abort: (() => void) | null;
}

export class StreamReconnectionManager<T> {
  private config: Required<ReconnectionConfig>;
  private connection: StreamConnection<T>;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private cleanupCallbacks: (() => void)[] = [];
  private messageHandlers: ((message: T) => void | Promise<void>)[] = [];
  private errorHandlers: ((error: Error) => void)[] = [];
  private connectFunction: () => Promise<AsyncIterable<T>>;
  private isMounted = true;

  constructor(
    connectFunction: () => Promise<AsyncIterable<T>>,
    config: ReconnectionConfig = {}
  ) {
    this.connectFunction = connectFunction;
    this.config = {
      initialDelayMs: config.initialDelayMs ?? 1000,
      maxDelayMs: config.maxDelayMs ?? 30000,
      maxAttempts: config.maxAttempts ?? Infinity,
      backoffMultiplier: config.backoffMultiplier ?? 2,
    };

    this.connection = {
      stream: null,
      isConnected: false,
      isReconnecting: false,
      attemptCount: 0,
      abort: null,
    };
  }

  onMessage(handler: (message: T) => void | Promise<void>): void {
    this.messageHandlers.push(handler);
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandlers.push(handler);
  }

  async connect(): Promise<void> {
    if (!this.isMounted) return;
    if (this.connection.isConnected || this.connection.isReconnecting) return;

    this.connection.isReconnecting = true;
    this.connection.attemptCount++;

    try {
      const abortController = new AbortController();
      this.connection.abort = () => abortController.abort();

      const stream = await this.connectFunction();
      
      if (!this.isMounted || abortController.signal.aborted) {
        return;
      }

      this.connection.stream = stream;
      this.connection.isConnected = true;
      this.connection.isReconnecting = false;
      this.connection.attemptCount = 0;

      this.startListening();
    } catch (error) {
      this.connection.isReconnecting = false;
      
      const err = error instanceof Error ? error : new Error(String(error));
      this.errorHandlers.forEach(handler => handler(err));

      if (this.connection.attemptCount < this.config.maxAttempts && this.isMounted) {
        this.scheduleReconnect();
      }
    }
  }

  private async startListening(): Promise<void> {
    if (!this.connection.stream || !this.isMounted) return;

    try {
      for await (const message of this.connection.stream) {
        if (!this.isMounted) break;

        for (const handler of this.messageHandlers) {
          try {
            await handler(message);
          } catch (error) {
            console.error('Error in message handler:', error);
          }
        }
      }

      if (this.isMounted) {
        this.handleDisconnection();
      }
    } catch (error) {
      if (this.isMounted) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.errorHandlers.forEach(handler => handler(err));
        this.handleDisconnection();
      }
    }
  }

  private handleDisconnection(): void {
    this.connection.isConnected = false;
    this.connection.stream = null;

    if (this.isMounted && this.connection.attemptCount < this.config.maxAttempts) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    const delay = Math.min(
      this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, this.connection.attemptCount - 1),
      this.config.maxDelayMs
    );

    this.reconnectTimeoutId = setTimeout(() => {
      if (this.isMounted) {
        this.connect();
      }
    }, delay);
  }

  disconnect(): void {
    this.isMounted = false;

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.connection.abort) {
      this.connection.abort();
      this.connection.abort = null;
    }

    this.connection.isConnected = false;
    this.connection.isReconnecting = false;
    this.connection.stream = null;

    this.cleanupCallbacks.forEach(cb => {
      try {
        cb();
      } catch (error) {
        console.error('Error in cleanup callback:', error);
      }
    });

    this.cleanupCallbacks = [];
    this.messageHandlers = [];
    this.errorHandlers = [];
  }

  addCleanup(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  isConnected(): boolean {
    return this.connection.isConnected;
  }

  isReconnecting(): boolean {
    return this.connection.isReconnecting;
  }

  getAttemptCount(): number {
    return this.connection.attemptCount;
  }
}

export function useStreamReconnection<T>(
  connectFunction: () => Promise<AsyncIterable<T>>,
  config?: ReconnectionConfig
): StreamReconnectionManager<T> {
  const managerRef = { current: null as StreamReconnectionManager<T> | null };

  if (!managerRef.current) {
    managerRef.current = new StreamReconnectionManager(connectFunction, config);
  }

  return managerRef.current;
}
