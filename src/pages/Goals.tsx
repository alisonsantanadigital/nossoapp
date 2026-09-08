import React, { useState, useEffect } from 'react';
import { Target, Trash2 } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useOrg } from '../contexts/OrgContext';
import { EmptyState } from '../components/ui/EmptyState';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { formatCurrency } from '../lib/utils';
import type { Goal } from '../types';

export function Goals() {
  const { organization } = useOrg();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [emoji, setEmoji] = useState('🎯');

  useEffect(() => {
    if (!organization?.id) return;

    const q = query(
      collection(db, 'goals'),
      where('orgId', '==', organization.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        deadline: doc.data().deadline?.toDate() || new Date()
      })) as Goal[];
      
      setGoals(goalsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'goals');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organization?.id]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'goals'), {
        orgId: organization.id,
        name,
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount) || 0,
        deadline: new Date(deadline),
        emoji,
        status: 'active'
      });
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'goals');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
      try {
        await deleteDoc(doc(db, 'goals', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `goals/${id}`);
      }
    }
  };

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('');
    setEmoji('🎯');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Metas</h1>
          <p className="text-slate-500 mt-1">Acompanhe seus grandes objetivos financeiros.</p>
        </div>
        {goals.length > 0 && (
          <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-teal-600/20">
            Nova Meta
          </Button>
        )}
      </header>

      {!loading && goals.length === 0 ? (
        <EmptyState
          icon={<Target className="w-8 h-8" />}
          title="Nenhuma meta definida"
          description="Você ainda não definiu nenhum objetivo financeiro. Que tal começar a planejar o futuro hoje?"
          actionLabel="Criar Primeira Meta"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <Card key={goal.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative group">
              <button 
                onClick={(e) => handleDeleteGoal(goal.id, e)}
                className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="h-32 bg-slate-100 flex items-center justify-center text-5xl">
                {(goal as any).emoji || '🎯'}
              </div>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg text-slate-900 mb-2">{goal.name}</h3>
                
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Acumulado</p>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(goal.currentAmount)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-medium">Objetivo</p>
                    <p className="text-sm font-medium text-slate-600">{formatCurrency(goal.targetAmount)}</p>
                  </div>
                </div>
                
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mb-4">
                  <div 
                    className="bg-indigo-500 h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%` }}
                  ></div>
                </div>
                
                <p className="text-xs text-slate-500 text-center font-medium bg-slate-50 py-2 rounded-lg">
                  Prazo: {goal.deadline.toLocaleDateString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Meta">
        <form onSubmit={handleAddGoal} className="space-y-4">
          <Input 
            label="Nome da Meta" 
            placeholder="Ex: Viagem para Europa"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="flex gap-4">
            <Input 
              label="Emoji" 
              placeholder="🎯"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-20 text-center text-lg"
              maxLength={2}
            />
            <Input 
              label="Prazo (Data)" 
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="flex-1"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Valor Objetivo (R$)" 
              type="number" 
              step="0.01"
              placeholder="10000.00"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
            <Input 
              label="Já Guardado (R$)" 
              type="number" 
              step="0.01"
              placeholder="0.00"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Salvar Meta</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
