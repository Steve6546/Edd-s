import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
  showHomeButton?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { fallbackTitle = 'Something went wrong', showHomeButton = true } = this.props;
      
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <Card className="max-w-lg w-full p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">{fallbackTitle}</h2>
                <p className="text-muted-foreground">
                  We encountered an unexpected error. This has been logged and we'll look into it.
                </p>
              </div>

              {this.state.error && (
                <details className="w-full text-left">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground mb-2">
                    Technical details
                  </summary>
                  <div className="bg-muted p-4 rounded-md text-xs font-mono overflow-auto max-h-40">
                    <p className="text-destructive font-semibold mb-2">{this.state.error.toString()}</p>
                    {this.state.errorInfo && (
                      <pre className="text-muted-foreground whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-3 w-full">
                <Button
                  onClick={this.handleReset}
                  className="flex-1 gap-2"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                
                {showHomeButton && (
                  <Button
                    onClick={this.handleGoHome}
                    className="flex-1 gap-2"
                    variant="outline"
                  >
                    <Home className="w-4 h-4" />
                    Go Home
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
