import { AlertTriangle, X } from '../../layouts/icons';

interface ProminentErrorAlertProps {
  message: string;
  onClose: () => void;
  onRetry?: () => void | Promise<void>;
  title?: string;
}

export default function ProminentErrorAlert({
  message,
  onClose,
  onRetry,
  title = 'No pudimos completar la operacion',
}: ProminentErrorAlertProps) {
  return (
    <div className="pointer-events-none fixed left-1/2 top-5 z-50 w-[min(95vw,52rem)] -translate-x-1/2">
      <div
        className="pointer-events-auto rounded-2xl border border-red-400/60 bg-gradient-to-r from-red-950/95 via-red-900/90 to-rose-900/90 p-4 shadow-2xl shadow-red-900/50"
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-red-300/20 p-2 text-red-200">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-100/90">
              Error de conexion
            </p>
            <h3 className="mt-0.5 text-base font-bold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-red-100/95">{message}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
                >
                  Reintentar
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-lg border border-red-200/40 px-3 py-1.5 text-sm font-medium text-red-100 transition-colors hover:bg-red-800/60"
              >
                Cerrar
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-md p-1 text-red-100/80 transition-colors hover:bg-red-800/60 hover:text-white"
            aria-label="Cerrar alerta"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
