import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useOrg } from "../contexts/OrgContext";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  isToday 
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import type { Transaction } from "../types";

export function CalendarView() {
  const { organization } = useOrg();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization?.id) return;

    // Fetch transactions (for simplicity we fetch all and filter locally, 
    // ideally we would query by date range for large datasets)
    const q = query(
      collection(db, "transactions"),
      where("orgId", "==", organization.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
      })) as Transaction[];
      
      setTransactions(transData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [organization?.id]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  
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

  const onDateClick = (day: Date) => setSelectedDate(day);

  // Generate days for the calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      
      // Calculate daily totals
      const dailyTransactions = transactions.filter(t => isSameDay(t.date, cloneDay));
      const dailyIncome = dailyTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const dailyExpense = dailyTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      
      const isSelected = selectedDate && isSameDay(day, selectedDate);
      const isCurrentMonth = isSameMonth(day, monthStart);
      const isCurrentDay = isToday(day);

      days.push(
        <div
          key={day.toString()}
          onClick={() => onDateClick(cloneDay)}
          className={`relative flex flex-col p-2 min-h-[80px] md:min-h-[100px] border border-white/5 cursor-pointer transition-all
            ${!isCurrentMonth ? "opacity-30 bg-transparent" : "bg-[#151E2E]/40 hover:bg-[#151E2E]"}
            ${isSelected ? "ring-2 ring-indigo-500 z-10 bg-[#151E2E]" : ""}
          `}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
              ${isCurrentDay ? "bg-indigo-500 text-white" : "text-slate-300"}
              ${isSelected && !isCurrentDay ? "text-indigo-400" : ""}
            `}>
              {formattedDate}
            </span>
          </div>
          
          <div className="mt-auto space-y-1">
            {dailyIncome > 0 && (
              <div className="text-[10px] sm:text-xs font-medium text-emerald-400 truncate flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3 shrink-0" />
                {formatCurrency(dailyIncome)}
              </div>
            )}
            {dailyExpense > 0 && (
              <div className="text-[10px] sm:text-xs font-medium text-rose-400 truncate flex items-center gap-0.5">
                <ArrowDownRight className="w-3 h-3 shrink-0" />
                {formatCurrency(dailyExpense)}
              </div>
            )}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  // Selected date transactions
  const selectedTransactions = selectedDate 
    ? transactions.filter(t => isSameDay(t.date, selectedDate))
    : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Calendário
          </h1>
          <p className="text-slate-400 mt-1">
            Visão mensal das suas despesas e receitas.
          </p>
        </div>
      </header>

      <div className="bg-[#151E2E] rounded-3xl border border-white/5 shadow-xl shadow-black/20 overflow-hidden">
        {/* Calendar Header */}
        <div className="p-4 md:p-6 flex items-center justify-between border-b border-white/5">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg md:text-xl font-bold text-white capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h2>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
        
        {/* Days of Week */}
        <div className="grid grid-cols-7 bg-white/[0.02] border-b border-white/5">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dayName, idx) => (
            <div key={idx} className="py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span className="hidden sm:inline">{dayName}</span>
              <span className="sm:hidden">{dayName.charAt(0)}</span>
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="flex flex-col bg-[#090E17]">
          {rows}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="bg-[#151E2E] rounded-3xl border border-white/5 p-6 shadow-xl shadow-black/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
            Lançamentos de {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </h3>
          
          {selectedTransactions.length === 0 ? (
            <p className="text-slate-400 text-sm">Nenhuma movimentação neste dia.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {selectedTransactions.map((tx, i) => (
                <div key={i} onDoubleClick={() => toggleTransactionStatus(tx)}
                  className={`py-3 px-4 -mx-4 rounded-2xl flex items-center justify-between group cursor-pointer select-none transition-colors ${
                    tx.status === "completed"
                      ? tx.type === "expense"
                        ? "bg-rose-500/10 hover:bg-rose-500/15"
                        : "bg-emerald-500/10 hover:bg-emerald-500/15"
                      : "hover:bg-white/[0.04]"
                  }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg shadow-inner">
                      {tx.emoji || (tx.type === "expense" ? "💸" : "💰")}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">
                        {tx.description}
                      </p>
                      <p className="text-xs text-slate-400 font-medium">
                        {tx.status === 'pending' ? 'Pendente' : 'Concluído'}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${tx.type === "income" ? "text-emerald-400" : "text-white"}`}>
                    {tx.type === "income" ? "+" : "-"}{" "}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
