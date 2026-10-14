import React from 'react';

export default function App(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold tracking-tight text-emerald-400">
        Sezzle Precision Calculator
      </h1>
      <p className="mt-2 text-sm text-slate-400" role="status" aria-live="polite">
        Precision Calculation Engine Ready
      </p>
    </main>
  );
}
