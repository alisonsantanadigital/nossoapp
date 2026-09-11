import React, { useState, useEffect, useMemo } from "react";
import { 
  PieChart as PieChartIcon, 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Target
} from "lucide-react";
import { 
  collection, 
  onSnapshot, 
  query, 
  where 
} from "firebase/firestore";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
  AreaChart, Area
} from "recharts";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { useOrg } from "../contexts/OrgContext";
import { EmptyState } from "../components/ui/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { formatCurrency } from "../lib/utils";
import type { Transaction } from "../types";

const COLORS = ['#0ea5e9', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#64748b'];

export function Analytics() {
  const { organization } = useOrg();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organization?.id) return;

    const q = query(
      collection(db, "transactions"),
      where("orgId", "==", organization.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const txs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date(),
        })) as Transaction[];
        setTransactions(txs);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "transactions");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [organization?.id]);

  // Derived data for charts
  const { 
    monthlyData, 
    expensesByDesc, 
    incomeVsExpense, 
    cashFlow,
    topExpenses
  } = useMemo(() => {
    if (!transactions.length) {
      return { monthlyData: [], expensesByDesc: [], incomeVsExpense: [], cashFlow: [], topExpenses: [] };
    }

    // 1. Monthly Income vs Expense
    const monthlyMap = new Map<string, { month: string; Entradas: number; Saídas: number; sortKey: string }>();
    
    // 2. Expenses by Description (Simulating Categories)
    const expenseDescMap = new Map<string, number>();

    // 3. Overall Income vs Expense
    let totalIncome = 0;
    let totalExpense = 0;

    // 4. Daily Cash Flow (accumulated over last 30 days or available data)
    // For simplicity, let's just group by day for the last 60 days
    const dailyMap = new Map<string, { dateStr: string; dateObj: Date; saldo: number }>();

    transactions.forEach(tx => {
      const monthYear = tx.date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
      const sortKey = `${tx.date.getFullYear()}-${String(tx.date.getMonth()).padStart(2, '0')}`;
      
      // Setup monthly
      if (!monthlyMap.has(sortKey)) {
        monthlyMap.set(sortKey, { month: monthYear, Entradas: 0, Saídas: 0, sortKey });
      }
      const monthData = monthlyMap.get(sortKey)!;

      // Setup daily flow
      const dateStr = tx.date.toISOString().split('T')[0];
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, { dateStr, dateObj: tx.date, saldo: 0 });
      }

      if (tx.type === 'income') {
        monthData.Entradas += tx.amount;
        totalIncome += tx.amount;
        dailyMap.get(dateStr)!.saldo += tx.amount;
      } else {
        monthData.Saídas += tx.amount;
        totalExpense += tx.amount;
        dailyMap.get(dateStr)!.saldo -= tx.amount;
        
        const descKey = tx.description || 'Outros';
        expenseDescMap.set(descKey, (expenseDescMap.get(descKey) || 0) + tx.amount);
      }
    });

    const monthlyData = Array.from(monthlyMap.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    const expensesByDesc = Array.from(expenseDescMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 categories

    const topExpenses = [...expensesByDesc].slice(0, 5); // Just top 5 for bar chart

    const incomeVsExpense = [
      { name: 'Entradas', value: totalIncome },
      { name: 'Saídas', value: totalExpense }
    ];

    // Calculate cumulative cashflow
    const sortedDays = Array.from(dailyMap.values()).sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    let currentBalance = 0;
    const cashFlow = sortedDays.map(day => {
      currentBalance += day.saldo;
      return {
        date: day.dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        Saldo: currentBalance
      };
    });

    return { monthlyData, expensesByDesc, incomeVsExpense, cashFlow, topExpenses };
  }, [transactions]);

  if (loading) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Análise Financeira
          </h1>
          <p className="text-slate-400 mt-1">
            Visão detalhada e histórica do seu comportamento financeiro.
          </p>
        </div>
      </header>

      {transactions.length === 0 ? (
        <EmptyState
          icon={<PieChartIcon className="w-8 h-8" />}
          title="Sem dados suficientes"
          description="Comece a registrar suas despesas e receitas para gerarmos gráficos e insights valiosos sobre sua vida financeira."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Evolução Mensal */}
          <Card className="col-span-1 lg:col-span-2 bg-[#151E2E] border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                Evolução Mensal (Entradas vs Saídas)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
                  <Tooltip 
                    cursor={{fill: '#e2e8f0', opacity: 0.4}}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                    itemStyle={{ color: '#0f172a' }}
                  />
                  <Legend />
                  <Bar dataKey="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Saídas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Fluxo de Caixa (Acumulado) */}
          <Card className="bg-[#151E2E] border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Fluxo de Caixa Histórico
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                  />
                  <Area type="monotone" dataKey="Saldo" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorSaldo)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Onde vai o dinheiro */}
          <Card className="bg-[#151E2E] border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-rose-400" />
                Maiores Despesas (Top 6)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByDesc}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {expensesByDesc.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                    formatter={(val: number) => formatCurrency(val)}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top 5 Gastos em Barras */}
          <Card className="bg-[#151E2E] border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-400" />
                Ranking de Gastos
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topExpenses} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    cursor={{fill: '#e2e8f0', opacity: 0.4}}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                  />
                  <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Proporção Geral */}
          <Card className="bg-[#151E2E] border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-400" />
                Balanço Histórico (Total)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeVsExpense}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={90}
                    dataKey="value"
                    stroke="#131B2F"
                    strokeWidth={2}
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                    formatter={(val: number) => formatCurrency(val)}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}

