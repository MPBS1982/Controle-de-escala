'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = 'Ocorreu um erro inesperado.';
      let firestoreInfo = null;

      try {
        if (this.state.error?.message) {
          firestoreInfo = JSON.parse(this.state.error.message);
          if (firestoreInfo.error) {
            errorMessage = `Erro no Firestore: ${firestoreInfo.error} (${firestoreInfo.operationType} em ${firestoreInfo.path})`;
          }
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops! Algo deu errado</h1>
            <p className="text-gray-600 mb-8">
              {errorMessage}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors w-full"
            >
              <RefreshCcw className="w-4 h-4" />
              Recarregar Página
            </button>
            {firestoreInfo && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left overflow-auto max-h-40">
                <pre className="text-[10px] text-gray-500 font-mono">
                  {(() => {
                    try {
                      return JSON.stringify(firestoreInfo, null, 2);
                    } catch (e) {
                      return 'Erro ao processar informações detalhadas.';
                    }
                  })()}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
