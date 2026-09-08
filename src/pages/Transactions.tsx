import React, { useState, useEffect } from 'react';
import { CreditCard, ArrowDownRight, ArrowUpRight, Trash2 } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, where, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useOrg } from '../contexts/OrgContext';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { formatCurrency } from '../lib/utils';
import type { Transaction } from '../types';

export function Transactions() {
  const { organization } = useOrg();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [emoji, setEmoji] = useState('🍔');

  useEffect(() => {
    if (!organization?.id) return;

    const q = query(
      collection(db, 'transactions'),
      where('orgId', '==', organization.id),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date()
      })) as Transaction[];
      
      setTransactions(transData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organization?.id]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'transactions'), {
        orgId: organization.id,
        amount: Number(amount),
        type,
        description,
        date: new Date(date),
        emoji,
        status: 'completed',
        accountId: 'default'
      });
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'transactions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      try {
        await deleteDoc(doc(db, 'transactions', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
      }
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setType('expense');
    setEmoji('🍔');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Despesas e Receitas</h1>
          <p className="text-slate-400 mt-1">Acompanhe todas as movimentações da sua casa.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-sky-500/20">Novo Lançamento</Button>
      </header>

      {!loading && transactions.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-8 h-8" />}
          title="Nenhuma movimentação"
          description="🌱 Sua vida financeira começa aqui. Adicione sua primeira despesa ou receita para começar a acompanhar seus gastos."
          actionLabel="Adicionar Lançamento"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="bg-[#131B2F] rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-800/60 overflow-hidden">
          <div className="divide-y divide-slate-800/60">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-[#1E293B] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#1E293B] flex items-center justify-center text-xl shadow-inner border border-slate-800/60">
                    {tx.emoji || (tx.type === 'expense' ? '💸' : '💰')}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{tx.description}</h4>
                    <p className="text-sm text-slate-400">{tx.date.toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className={`font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                      {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDeleteTransaction(tx.id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Novo Lançamento">
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="flex p-1 bg-[#0B1121] rounded-xl mb-4 border border-slate-800/60">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center transition-all ${type === 'expense' ? 'bg-[#1E293B] text-rose-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              <ArrowDownRight className="w-4 h-4 mr-1" /> Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center transition-all ${type === 'income' ? 'bg-[#1E293B] text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              <ArrowUpRight className="w-4 h-4 mr-1" /> Receita
            </button>
          </div>

          <Input 
            label="Valor (R$)" 
            type="number" 
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
          <Input 
            label="Descrição" 
            placeholder={type === 'expense' ? "Ex: Supermercado" : "Ex: Salário"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <div className="flex gap-4">
            <Input 
              label="Emoji" 
              placeholder={type === 'expense' ? "🍔" : "💰"}
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-20 text-center text-lg"
              maxLength={2}
            />
            <Input 
              label="Data" 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1"
              required
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
