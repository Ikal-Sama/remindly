"use client";

import React from "react";
import ErrorBoundary from "@/components/ui/error-boundary";

interface PageErrorBoundaryProps {
  children: React.ReactNode;
}

export default function PageErrorBoundary({
  children,
}: PageErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={({ error, reset }) => (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-6 max-w-md mx-auto p-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-red-600">Oops!</h1>
              <h2 className="text-xl font-semibold">Something went wrong</h2>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                {error?.message ||
                  "An unexpected error occurred while loading this page."}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Go Home
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
