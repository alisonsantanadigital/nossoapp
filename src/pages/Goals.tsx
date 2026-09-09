import React, { useState, useEffect, useMemo } from "react";
import { Target, Trash2, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useOrg } from "../contexts/OrgContext";
import { EmptyState } from "../components/ui/EmptyState";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import { formatCurrency } from "../lib/utils";
import type { Goal, Transaction } from "../types";

export function Goals() {
  const { organization } = useOrg();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [type, setType] = useState<"savings" | "income" | "expense">("savings");
  
  useEffect(() => {
    if (!organization?.id) return;

    const qGoals = query(
      collection(db, "goals"),
      where("orgId", "==", organization.id),
    );

    const unsubGoals = onSnapshot(qGoals, (snapshot) => {
      const goalsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        deadline: doc.data().deadline?.toDate() || new Date(),
      })) as Goal[];
      setGoals(goalsData);
    });

    const qTx = query(
      collection(db, "transactions"),
      where("orgId", "==", organization.id)
    );

    const unsubTx = onSnapshot(qTx, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date()
      })) as Transaction[];
      setTransactions(txs);
      setLoading(false);
    });

    return () => {
      unsubGoals();
      unsubTx();
    };
  }, [organization?.id]);

  const currentMonthData = useMemo(() => {
    const now = new Date();
    let income = 0;
    let expense = 0;

    transactions.forEach(tx => {
      if (tx.date.getMonth() === now.getMonth() && tx.date.getFullYear() === now.getFullYear()) {
        if (tx.type === 'income') income += tx.amount;
        else expense += tx.amount;
      }
    });

    return { income, expense };
  }, [transactions]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "goals"), {
        orgId: organization.id,
        name,
        targetAmount: Number(targetAmount),
        currentAmount: 0, // Used for legacy/savings
        type: type,
        status: "active",
      });
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "goals");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir esta meta?")) {
      try {
        await deleteDoc(doc(db, "goals", id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `goals/${id}`);
      }
    }
  };

  const resetForm = () => {
    setName("");
    setTargetAmount("");
    setType("savings");
  };

  const getGoalProgress = (goal: any) => {
    const goalType = goal.type || 'savings';
    let current = goal.currentAmount || 0;
    
    if (goalType === 'income') {
      current = currentMonthData.income;
    } else if (goalType === 'expense') {
      current = currentMonthData.expense;
    }

    const percentage = Math.min(100, Math.max(0, (current / goal.targetAmount) * 100));
    
    return {
      current,
      percentage,
      isDanger: goalType === 'expense' && current > goal.targetAmount
    };
  };

  const getGoalIcon = (type: string) => {
    if (type === 'income') return <TrendingUp className="w-10 h-10 text-emerald-400" />;
    if (type === 'expense') return <TrendingDown className="w-10 h-10 text-rose-400" />;
    return <PiggyBank className="w-10 h-10 text-sky-400" />;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Metas Concretas
          </h1>
          <p className="text-slate-400 mt-1">
            Defina limites de gastos ou metas de receita baseados em seus dados reais.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="shadow-lg shadow-sky-500/20"
        >
          Nova Meta
        </Button>
      </header>

      {!loading && goals.length === 0 ? (
        <EmptyState
          icon={<Target className="w-8 h-8" />}
          title="Nenhuma meta definida"
          description="Você ainda não definiu nenhum objetivo financeiro. Que tal definir um limite de gastos para o mês?"
          actionLabel="Criar Primeira Meta"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const { current, percentage, isDanger } = getGoalProgress(goal);
            const goalType = goal.type || 'savings';

            return (
              <Card
                key={goal.id}
                className="overflow-hidden hover:shadow-lg transition-shadow relative group bg-[#131B2F] border-slate-800/60"
              >
                <button
                  onClick={(e) => handleDeleteGoal(goal.id, e)}
                  className="absolute top-4 right-4 p-2 bg-[#1E293B] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="h-24 bg-[#1E293B] flex items-center justify-center border-b border-slate-800/60">
                  {getGoalIcon(goalType)}
                </div>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-slate-800 text-slate-300">
                      {goalType === 'income' ? 'Meta de Receita' : goalType === 'expense' ? 'Limite de Gastos' : 'Economia'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg text-white mb-4">
                    {goal.name}
                  </h3>

                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">
                        {goalType === 'expense' ? 'Já Gasto' : 'Alcançado'}
                      </p>
                      <p className={`text-lg font-bold ${isDanger ? 'text-rose-400' : 'text-white'}`}>
                        {formatCurrency(current)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-medium">
                        {goalType === 'expense' ? 'Limite' : 'Objetivo'}
                      </p>
                      <p className="text-sm font-medium text-slate-300">
                        {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-[#1E293B] rounded-full h-2.5 overflow-hidden border border-slate-800/60">
                    <div
                      className={`h-2.5 rounded-full ${
                        isDanger 
                          ? 'bg-rose-500' 
                          : goalType === 'income' 
                            ? 'bg-emerald-500' 
                            : 'bg-sky-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Meta"
      >
        <form onSubmit={handleAddGoal} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Tipo de Meta</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                  type === 'income' 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                    : 'bg-[#1E293B] border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Meta de Renda
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                  type === 'expense' 
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400' 
                    : 'bg-[#1E293B] border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Limite de Gastos
              </button>
            </div>
          </div>
          <Input
            label="Nome da Meta"
            placeholder={type === 'income' ? 'Ex: Fazer R$ 10.000 no mês' : 'Ex: Gastar no máximo R$ 3.000'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Valor Objetivo (R$)"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Salvar Meta
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

