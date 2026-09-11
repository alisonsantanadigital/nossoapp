const fs = require('fs');
const path = './src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const regexMetrics = /\/\/ Calculate metrics[\s\S]*?const metrics = {[\s\S]*?};/m;

const newMetrics = `// Calculate metrics
  const completedIncomes = transactions
    .filter((t) => t.type === "income" && t.status === "completed")
    .reduce((acc, t) => acc + t.amount, 0);
  const completedExpenses = transactions
    .filter((t) => t.type === "expense" && t.status === "completed")
    .reduce((acc, t) => acc + t.amount, 0);
  const actualBalance = completedIncomes - completedExpenses;

  const incomes = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
  const predictedBalance = incomes - expenses;

  const saved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const pendingBills = transactions
    .filter((t) => t.status === "pending")
    .reduce((acc, t) => acc + t.amount, 0);
  const safeToSpendDaily = Math.max(0, (actualBalance - pendingBills) / 30); // simplistic calculation

  const metrics = {
    actualBalance,
    predictedBalance,
    incomes,
    expenses,
    saved,
    pendingBills,
    safeToSpendDaily,
  };`;

content = content.replace(regexMetrics, newMetrics);

content = content.replace('{formatCurrency(metrics.balance)}', '{formatCurrency(metrics.actualBalance)}');

const oldGrid = `<div className="grid grid-cols-2 gap-4">
            <div 
              onClick={(e) => { e.stopPropagation(); navigate("/transactions", { state: { filter: "income" } }); }}
              className="bg-white/5 p-4 rounded-3xl backdrop-blur-sm border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1"> 
                 <ArrowUpRight className="w-4 h-4 text-emerald-300" />
                 <p className="text-sky-50 text-xs md:text-sm font-medium">Entradas</p>
              </div>
              <p className="text-lg md:text-xl font-bold">
                {formatCurrency(metrics.incomes)}
              </p>
            </div>
            <div 
              onClick={(e) => { e.stopPropagation(); navigate("/transactions", { state: { filter: "expense" } }); }}
              className="bg-white/5 p-4 rounded-3xl backdrop-blur-sm border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1"> 
                 <ArrowDownRight className="w-4 h-4 text-rose-300" />
                 <p className="text-sky-50 text-xs md:text-sm font-medium">Saídas</p>
              </div>
              <p className="text-lg md:text-xl font-bold">
                {formatCurrency(metrics.expenses)}
              </p>
            </div>
          </div>`;

const newGrid = `<div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div 
              onClick={(e) => { e.stopPropagation(); navigate("/transactions", { state: { filter: "income" } }); }}
              className="bg-white/5 p-3 sm:p-4 rounded-2xl sm:rounded-3xl backdrop-blur-sm border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-1 sm:gap-2 mb-1"> 
                 <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-300 shrink-0" />
                 <p className="text-sky-50 text-[10px] sm:text-xs md:text-sm font-medium truncate">Entradas</p>
              </div>
              <p className="text-sm sm:text-base md:text-xl font-bold truncate">
                {formatCurrency(metrics.incomes)}
              </p>
            </div>
            <div 
              onClick={(e) => { e.stopPropagation(); navigate("/transactions", { state: { filter: "expense" } }); }}
              className="bg-white/5 p-3 sm:p-4 rounded-2xl sm:rounded-3xl backdrop-blur-sm border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-1 sm:gap-2 mb-1"> 
                 <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-rose-300 shrink-0" />
                 <p className="text-sky-50 text-[10px] sm:text-xs md:text-sm font-medium truncate">Saídas</p>
              </div>
              <p className="text-sm sm:text-base md:text-xl font-bold truncate">
                {formatCurrency(metrics.expenses)}
              </p>
            </div>
            <div 
              className="bg-white/5 p-3 sm:p-4 rounded-2xl sm:rounded-3xl backdrop-blur-sm border border-white/10 transition-colors"
            >
              <div className="flex items-center gap-1 sm:gap-2 mb-1"> 
                 <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-indigo-200 shrink-0" />
                 <p className="text-sky-50 text-[10px] sm:text-xs md:text-sm font-medium truncate">Previsto</p>
              </div>
              <p className="text-sm sm:text-base md:text-xl font-bold truncate">
                {formatCurrency(metrics.predictedBalance)}
              </p>
            </div>
          </div>`;

content = content.replace(oldGrid, newGrid);
fs.writeFileSync(path, content);

