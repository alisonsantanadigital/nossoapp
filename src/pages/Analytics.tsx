import React from "react";
import { PieChart } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";

export function Analytics() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Análises
          </h1>
          <p className="text-slate-400 mt-1">
            Entenda para onde está indo o seu dinheiro.
          </p>
        </div>
      </header>

      <EmptyState
        icon={<PieChart className="w-8 h-8" />}
        title="Sem dados suficientes"
        description="Comece a registrar suas despesas e receitas para gerarmos gráficos e insights valiosos sobre sua vida financeira."
      />
    </div>
  );
}
