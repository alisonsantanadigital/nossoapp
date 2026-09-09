import React, { useState } from "react";
import { ShoppingBag, ExternalLink } from "lucide-react";
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
            Quero Comprar
          </h1>
          <p className="text-slate-400 mt-1">
            Lista de desejos integrada ao seu planejamento.
          </p>
        </div>
        {items.length > 0 && (
          <Button className="shadow-lg shadow-sky-500/20">
            Adicionar Item
          </Button>
        )}
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="Sua lista está vazia"
          description="Adicione itens que você deseja comprar para planejarmos juntos como encaixá-los no seu orçamento."
          actionLabel="Adicionar Desejo"
          onAction={() => {
            setItems([
              {
                id: 1,
                name: "MacBook Air M2",
                price: 8500,
                priority: "Alta",
                date: "Dez 2024",
                emoji: "💻",
                status: "planned",
              },
            ]);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-[#1E293B] rounded-xl flex items-center justify-center text-2xl">
                    {item.emoji}
                  </div>
                  <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                    Prioridade {item.priority}
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-white mb-1">
                  {item.name}
                </h3>
                <p className="text-2xl font-bold text-white mb-4">
                  R$ {item.price}
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
                  <Button variant="outline" className="w-full" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver na Loja
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
