import React, { useState } from "react";
import { ShoppingBag, CreditCard } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export function Wishlist() {
  const [items, setItems] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Gastos Planejados
          </h1>
          <p className="text-slate-400 mt-1">
            Programe suas próximas compras e despesas grandes.
          </p>
        </div>
        {items.length > 0 && (
          <Button className="shadow-lg shadow-sky-500/20">
            Adicionar Gasto
          </Button>
        )}
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="Nenhum gasto planejado"
          description="Registre aqui aquelas despesas ou compras que você pretende fazer no futuro, para não comprometer o orçamento do mês."
          actionLabel="Adicionar Gasto"
          onAction={() => {
            setItems([
              {
                id: 1,
                name: "Troca de Pneus do Carro",
                price: 1800,
                priority: "Alta",
                date: "Nov 2026",
                emoji: "🚗",
                status: "planned",
              },
            ]);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow bg-[#131B2F] border-slate-800/60">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-[#1E293B] rounded-xl flex items-center justify-center text-2xl">
                    {item.emoji}
                  </div>
                  <span className="text-xs font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">
                    Prioridade {item.priority}
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-white mb-1">
                  {item.name}
                </h3>
                <p className="text-2xl font-bold text-white mb-4">
                  R$ {item.price.toFixed(2)}
                </p>

                <div className="space-y-3">
                  <div className="bg-[#1E293B] p-3 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      Planejado para
                    </span>
                    <span className="text-sm font-medium text-white">
                      {item.date}
                    </span>
                  </div>
                  <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-slate-300" size="sm">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Registrar Pagamento
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

