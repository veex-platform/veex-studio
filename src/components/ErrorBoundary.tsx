import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0b0e14] text-slate-200 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle size={32} className="text-red-500" />
                    </div>

                    <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                    <p className="text-slate-400 max-w-md mb-8">
                        Veex Studio encountered an unexpected error. Please try reloading the page.
                    </p>

                    <div className="bg-black/30 p-4 rounded-lg border border-white/5 font-mono text-xs text-left w-full max-w-2xl overflow-auto mb-8 max-h-64">
                        <div className="text-red-400 mb-2 font-bold">{this.state.error?.toString()}</div>
                        <div className="text-slate-500 whitespace-pre-wrap">
                            {this.state.errorInfo?.componentStack}
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition shadow-lg shadow-blue-500/20"
                    >
                        <RefreshCw size={18} /> Reload Studio
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
