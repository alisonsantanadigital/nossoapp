import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
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
  const location = useLocation();
  const [filterType, setFilterType] = useState<"all" | "income" | "expense" | "pending">(location.state?.filter || "all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTabKey, setActiveTabKey] = useState<string>("");

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
    if (location.state?.filter) {
      setFilterType(location.state.filter);
    }
  }, [location.state?.filter]);

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

  const groupedTransactions = useMemo(() => {
    const groups: {
      monthYear: string;
      sortKey: string;
      income: number;
      expense: number;
      items: Transaction[];
    }[] = [];

    const filteredTransactions = transactions.filter((tx) => {
      if (filterType === "all") return true;
      if (filterType === "pending") return tx.status === "pending"; // if you have a pending status, or perhaps treat dummy bills this way
      return tx.type === filterType;
    });

    filteredTransactions.forEach((tx) => {
      const monthYear = tx.date.toLocaleString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      const capitalizedMonth =
        monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
      const sortKey = `${tx.date.getFullYear()}-${String(tx.date.getMonth()).padStart(2, "0")}`;

      let group = groups.find((g) => g.sortKey === sortKey);
      if (!group) {
        group = {
          monthYear: capitalizedMonth,
          sortKey,
          income: 0,
          expense: 0,
          items: [],
        };
        groups.push(group);
      }

      group.items.push(tx);
      if (tx.type === "income") {
        group.income += tx.amount;
      } else {
        group.expense += tx.amount;
      }
    });

    return groups.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [transactions]);

  useEffect(() => {
    if (groupedTransactions.length > 0 && !groupedTransactions.find(g => g.sortKey === activeTabKey)) {
      setActiveTabKey(groupedTransactions[0].sortKey);
    }
  }, [groupedTransactions, activeTabKey]);

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

  
  const toggleTransactionStatus = async (tx: Transaction) => {
    if (!navigator.onLine) {
      alert("Sem conexão com a internet.");
      return;
    }
    try {
      const newStatus = tx.status === "completed" ? "pending" : "completed";
      await updateDoc(doc(db, "transactions", tx.id), {
        status: newStatus
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar o status do lançamento.");
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!navigator.onLine) {
      alert("Sem conexão com a internet. Verifique sua rede e tente novamente.");
      return;
    }

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
                status: installmentDate <= new Date() ? "completed" : "pending",
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
            status: baseDate <= new Date() ? "completed" : "pending",
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
        <Button onClick={handleOpenNew} className="shadow-lg shadow-indigo-500/20">
          Novo Lançamento
        </Button>
      </header>

      {/* Filters */}
      <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-none">
        {(["all", "income", "expense", "pending"] as const).map((ft) => (
          <button
            key={ft}
            onClick={() => setFilterType(ft)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filterType === ft ? "bg-indigo-500 text-white shadow-md" : "bg-white/5 text-slate-400 hover:text-white"}`}
          >
            {ft === "all" ? "Todos" : ft === "income" ? "Entradas" : ft === "expense" ? "Saídas" : "Pendentes"}
          </button>
        ))}
      </div>

      {groupedTransactions.length > 0 && (
        <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-none">
          {groupedTransactions.map((group) => (
            <button
              key={group.sortKey}
              onClick={() => setActiveTabKey(group.sortKey)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTabKey === group.sortKey ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-400 hover:text-white"}`}
            >
              {group.monthYear}
            </button>
          ))}
        </div>
      )}

      {!loading && transactions.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-8 h-8" />}
          title="Nenhuma movimentação"
          description="🌱 Nenhuma movimentação encontrada."
          actionLabel="Adicionar Lançamento"
          onAction={handleOpenNew}
        />
      ) : (
        <div className="space-y-8">
          {groupedTransactions.filter(g => g.sortKey === activeTabKey).map((group) => (
            <div key={group.sortKey} className="space-y-4">
              <div className="flex justify-between items-end px-1 border-b border-white/5 pb-2">
                <h3 className="text-lg font-semibold text-white">
                  Resumo do Mês
                </h3>
                <div className="flex gap-3 sm:gap-4 text-sm">
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Entradas</span>
                    <span className="text-emerald-400 font-medium text-xs sm:text-sm">
                      +{formatCurrency(group.income)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Saídas</span>
                    <span className="text-rose-400 font-medium text-xs sm:text-sm">
                      -{formatCurrency(group.expense)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end border-l border-white/10 pl-3 sm:pl-4">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Previsto</span>
                    <span className={`font-medium text-xs sm:text-sm ${group.income - group.expense >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                      {formatCurrency(group.income - group.expense)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#151E2E] rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-white/5 overflow-hidden">
                <div className="divide-y divide-white/5">
                  {group.items.map((tx) => (
                    <div
                      key={tx.id}
                      onDoubleClick={() => toggleTransactionStatus(tx)}
                      className={`p-4 sm:px-6 flex items-center justify-between transition-colors group cursor-pointer select-none ${
                        tx.status === "completed"
                          ? tx.type === "expense"
                            ? "bg-rose-500/10 hover:bg-rose-500/15"
                            : "bg-emerald-500/10 hover:bg-emerald-500/15"
                          : "hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-3xl bg-white/5 flex items-center justify-center text-xl shadow-inner border border-white/5 overflow-hidden shrink-0 relative">
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
                            className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? "Editar Lançamento" : "Novo Lançamento"}
      >
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="flex p-1 bg-[#090E17] rounded-3xl mb-4 border border-white/5">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center transition-all ${type === "expense" ? "bg-white/5 text-rose-400 shadow-sm" : "text-slate-400 hover:text-white"}`}
            >
              <ArrowDownRight className="w-4 h-4 mr-1" /> Despesa
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center transition-all ${type === "income" ? "bg-white/5 text-emerald-400 shadow-sm" : "text-slate-400 hover:text-white"}`}
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
                className="flex h-11 w-full items-center justify-center rounded-3xl border border-white/10 bg-[#090E17] px-3 py-2 text-2xl hover:bg-white/[0.04] transition-colors"
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
                    theme={"light" as any}
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
            <div className="mt-2 rounded-3xl overflow-hidden border border-white/10 h-32 w-full flex items-center justify-center bg-[#090E17]">
              <img
                src={imageBase64}
                alt="Preview"
                className="h-full object-contain"
              />
            </div>
          )}

          {!editingId && (
            <div className="p-4 bg-[#090E17] rounded-3xl border border-white/5 space-y-4">
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
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#151E2E] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {!isFixed && (
                <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
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
