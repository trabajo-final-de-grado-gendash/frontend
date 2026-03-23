import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle } from '../../layouts/icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[var(--color-bg-main)] p-8">
          <AlertCircle className="h-12 w-12 text-[var(--color-error)]" />
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
            Ocurrió un error inesperado
          </h1>
          <p className="max-w-md text-center text-sm text-[var(--color-text-secondary)]">
            {this.state.error?.message || 'Algo salió mal. Intenta recargar la página.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:bg-[var(--color-primary-hover)]"
          >
            Recargar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
