import React, { useState, useEffect, useRef } from "react";
import {
  CreditCard,
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Repeat,
  ListOrdered,
  X,
  Smile,
} from "lucide-react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useOrg } from "../contexts/OrgContext";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Input } from "../components/ui/Input";
import EmojiPicker from "emoji-picker-react";
import { formatCurrency } from "../lib/utils";
import type { Transaction } from "../types";

export function Transactions() {
  const { organization } = useOrg();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [emoji, setEmoji] = useState("🍔");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const [installments, setInstallments] = useState(1);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!organization?.id) return;

    const q = query(
      collection(db, "transactions"),
      where("orgId", "==", organization.id),
      orderBy("date", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const transData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date(),
        })) as Transaction[];

        setTransactions(transData);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "transactions");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [organization?.id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageBase64(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingId(tx.id);
    setType(tx.type);
    setAmount(tx.amount.toString());
    setDescription(tx.description);
    setDate(tx.date.toISOString().split("T")[0]);
    setEmoji(tx.emoji || "");
    setIsFixed(tx.isFixed || false);
    setInstallments(1); // Installments are usually a one-time generation thing, but we reset here
    setImageBase64(tx.imageUrl || null);
    setIsModalOpen(true);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) return;
    setIsSubmitting(true);

    try {
      const numericAmount = Number(amount);
      const baseDate = new Date(date);

      if (editingId) {
        // Edit existing
        await updateDoc(doc(db, "transactions", editingId), {
          amount: numericAmount,
          type,
          description,
          date: baseDate,
          emoji,
          isFixed,
          imageUrl: imageBase64,
        });
      } else {
        // Create new
        if (installments > 1 && !isFixed) {
          // Add multiple for installments (split value)
          const installmentAmount = numericAmount / installments;
          const batchPromises = [];

          for (let i = 0; i < installments; i++) {
            const installmentDate = new Date(baseDate);
            installmentDate.setMonth(baseDate.getMonth() + i);

            batchPromises.push(
              addDoc(collection(db, "transactions"), {
                orgId: organization.id,
                amount: installmentAmount, // Value per installment
                type,
                description,
                date: installmentDate,
                emoji,
                status: "completed",
                accountId: "default",
                isFixed: false,
                installmentInfo: `${i + 1}/${installments}`,
                imageUrl: imageBase64,
              }),
            );
          }
          await Promise.all(batchPromises);
        } else {
          // Single transaction
          await addDoc(collection(db, "transactions"), {
            orgId: organization.id,
            amount: numericAmount,
            type,
            description,
            date: baseDate,
            emoji,
            status: "completed",
            accountId: "default",
            isFixed,
            imageUrl: imageBase64,
          });
        }
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      handleFirestoreError(
        error,
        editingId ? OperationType.UPDATE : OperationType.CREATE,
        "transactions",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este lançamento?")) {
      try {
        await deleteDoc(doc(db, "transactions", id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `transactions/${id}`);
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setAmount("");
    setDescription("");
    setDate(new Date().toISOString().split("T")[0]);
    setType("expense");
    setEmoji("🍔");
    setIsFixed(false);
    setInstallments(1);
    setImageBase64(null);
  };

  const handleOpenNew = () => {
    resetForm();
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Despesas e Receitas
          </h1>
          <p className="text-slate-400 mt-1">
            Acompanhe todas as movimentações da sua casa.
          </p>
        </div>
        <Button onClick={handleOpenNew} className="shadow-lg shadow-sky-500/20">
          Novo Lançamento
        </Button>
      </header>

      {!loading && transactions.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-8 h-8" />}
          title="Nenhuma movimentação"
          description="🌱 Sua vida financeira começa aqui. Adicione sua primeira despesa ou receita para começar a acompanhar seus gastos."
          actionLabel="Adicionar Lançamento"
          onAction={handleOpenNew}
        />
      ) : (
        <div className="bg-[#131B2F] rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-800/60 overflow-hidden">
          <div className="divide-y divide-slate-800/60">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 sm:px-6 flex items-center justify-between hover:bg-[#1E293B] transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#1E293B] flex items-center justify-center text-xl shadow-inner border border-slate-800/60 overflow-hidden shrink-0 relative">
                    {tx.imageUrl ? (
                      <img
                        src={tx.imageUrl}
                        alt={tx.description}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      tx.emoji || (tx.type === "expense" ? "💸" : "💰")
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white">
                        {tx.description}
                      </h4>
                      {tx.isFixed && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          Fixa
                        </span>
                      )}
                      {tx.installmentInfo && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Parc. {tx.installmentInfo}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">
                      {tx.date.toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span
                      className={`font-bold ${tx.type === "income" ? "text-emerald-400" : "text-white"}`}
                    >
                      {tx.type === "income" ? "+" : "-"}{" "}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(tx)}
                      className="p-2 text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTransaction(tx.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Editar Lançamento" : "Novo Lançamento"}
      >
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="flex p-1 bg-[#0B1121] rounded-xl mb-4 border border-slate-800/60">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center transition-all ${type === "expense" ? "bg-[#1E293B] text-rose-400 shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              <ArrowDownRight className="w-4 h-4 mr-1" /> Despesa
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center transition-all ${type === "income" ? "bg-[#1E293B] text-emerald-400 shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              <ArrowUpRight className="w-4 h-4 mr-1" /> Receita
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={
                installments > 1 && !editingId
                  ? "Valor Total (R$)"
                  : "Valor (R$)"
              }
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="Data"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Descrição"
            placeholder={
              type === "expense" ? "Ex: Supermercado" : "Ex: Salário"
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <div className="flex gap-4 relative">
            <div className="space-y-2 w-24 shrink-0">
              <label className="text-sm font-medium leading-none text-slate-300">
                Ícone
              </label>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-700 bg-[#0B1121] px-3 py-2 text-2xl hover:bg-slate-800 transition-colors"
              >
                {emoji}
              </button>
            </div>

            {showEmojiPicker && (
              <div className="absolute top-20 left-0 z-50 shadow-2xl">
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowEmojiPicker(false)}
                ></div>
                <div className="relative z-50">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setEmoji(emojiData.emoji);
                      setShowEmojiPicker(false);
                    }}
                    theme={"dark" as any}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium leading-none text-slate-300">
                Foto / Comprovante
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  {imageBase64 ? "Trocar Imagem" : "Anexar Imagem"}
                </Button>
                {imageBase64 && (
                  <button
                    type="button"
                    onClick={() => setImageBase64(null)}
                    className="p-2 text-slate-400 hover:text-rose-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {imageBase64 && (
            <div className="mt-2 rounded-xl overflow-hidden border border-slate-700 h-32 w-full flex items-center justify-center bg-[#0B1121]">
              <img
                src={imageBase64}
                alt="Preview"
                className="h-full object-contain"
              />
            </div>
          )}

          {!editingId && (
            <div className="p-4 bg-[#0B1121] rounded-xl border border-slate-800/60 space-y-4">
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                Recorrência e Parcelamento
              </h4>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-slate-300">
                    É uma despesa fixa mensal?
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFixed}
                    onChange={(e) => {
                      setIsFixed(e.target.checked);
                      if (e.target.checked) setInstallments(1);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {!isFixed && (
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <ListOrdered className="w-4 h-4 text-indigo-400" />
                    Quantidade de parcelas
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="72"
                    value={installments}
                    onChange={(e) =>
                      setInstallments(parseInt(e.target.value) || 1)
                    }
                  />
                  {installments > 1 && (
                    <p className="text-xs text-slate-400 mt-1">
                      O valor total de R$ {amount || "0"} será dividido em{" "}
                      {installments} vezes de R${" "}
                      {(Number(amount) / installments).toFixed(2)}.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingId ? "Salvar Alterações" : "Salvar Lançamento"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
