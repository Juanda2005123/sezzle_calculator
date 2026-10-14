import React from 'react';
import { Calculator } from './components/Calculator';

export default function App(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 antialiased selection:bg-emerald-500 selection:text-slate-950">
      <header className="text-center mb-6 max-w-md w-full">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-400 drop-shadow-sm">
          Sezzle Precision Calculator
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400 font-medium">
          Arbitrary-Precision Base-10 Arithmetic &bull; Pure Financial Accuracy
        </p>
      </header>

      <Calculator />
    </main>
  );
}
