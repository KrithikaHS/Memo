import React from 'react';
import { Button } from './ui/button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetData = () => {
    if (confirm("This will clear your local data to fix the crash. Are you sure?")) {
        localStorage.clear();
        indexedDB.deleteDatabase('MemoAppDB');
        window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-center">
          <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
          <p className="mb-8 text-slate-500 max-w-md">
            The application encountered an unexpected error.
          </p>
          <div className="flex gap-4">
            <Button onClick={this.handleReload}>
              Reload Page
            </Button>
            <Button variant="destructive" onClick={this.handleResetData}>
              Reset Data
            </Button>
          </div>
          {this.state.error && (
             <pre className="mt-8 p-4 bg-red-50 dark:bg-red-950/30 text-red-600 rounded text-xs text-left overflow-auto max-w-full max-h-64 border border-red-200 dark:border-red-900">
                {this.state.error.toString()}
             </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
