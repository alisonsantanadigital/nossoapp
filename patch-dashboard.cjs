const fs = require('fs');
const path = './src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add period filter state
if (!content.includes('periodFilter')) {
  content = content.replace(
    'const [goals, setGoals] = useState<Goal[]>([]);',
    'const [goals, setGoals] = useState<Goal[]>([]);\n  const [periodFilter, setPeriodFilter] = useState<"current_month" | "all_time">("current_month");'
  );
}

// 2. Wrap avatar in Link
const avatarOld = `{userProfile?.photoURL ? (
            <img src={userProfile.photoURL} alt={displayName} className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border-2 border-white/10" />
          ) : (
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-slate-400" />
            </div>
          )}`;
const avatarNew = `<Link to="/settings" title="Editar Perfil" className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity active:scale-95">
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt={displayName} className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border-2 border-white/10" />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-slate-400" />
              </div>
            )}
          </Link>`;
content = content.replace(avatarOld, avatarNew);

// 3. Add filter logic for transactions
const calcOld = `// Calculate metrics
  const completedIncomes = transactions
    .filter((t) => t.type === "income" && t.status === "completed")
    .reduce((acc, t) => acc + t.amount, 0);`;

const calcNew = `// Filter by period
  const now = new Date();
  const currentMonthNum = now.getMonth();
  const currentYear = now.getFullYear();

  const filteredTransactions = transactions.filter((tx) => {
    if (periodFilter === "all_time") return true;
    
    // Calculate date
    const txDate = tx.date && typeof (tx.date as any).toDate === "function" 
      ? (tx.date as any).toDate() 
      : new Date(tx.date);
      
    return txDate.getMonth() === currentMonthNum && txDate.getFullYear() === currentYear;
  });

  // Calculate metrics
  const completedIncomes = filteredTransactions
    .filter((t) => t.type === "income" && t.status === "completed")
    .reduce((acc, t) => acc + t.amount, 0);`;

if (!content.includes('filteredTransactions = transactions.filter')) {
  content = content.replace(calcOld, calcNew);

  // Replace transactions with filteredTransactions in other calculations
  content = content.replace(
    'const completedExpenses = transactions',
    'const completedExpenses = filteredTransactions'
  );
  content = content.replace(
    'const incomes = transactions',
    'const incomes = filteredTransactions'
  );
  content = content.replace(
    'const expenses = transactions',
    'const expenses = filteredTransactions'
  );
  content = content.replace(
    'const pendingBills = transactions',
    'const pendingBills = filteredTransactions'
  );
}

// 4. Add the select dropdown for periodFilter
const currentMonthOld = `<span className="capitalize">{currentMonth}</span>.`;
const currentMonthNew = `
              {periodFilter === "current_month" ? (
                <span>em <span className="capitalize">{currentMonth}</span>.</span>
              ) : (
                <span>em <strong>Todo o Período</strong>.</span>
              )}
`;

content = content.replace(currentMonthOld, currentMonthNew);

const dashHeaderEndOld = `</p>
          </div>
        </div>
      </header>`;

const dashHeaderEndNew = `</p>
          </div>
        </div>
        <div className="flex gap-2">
           <select 
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="bg-[#151E2E] border border-white/10 text-white text-sm rounded-2xl px-4 py-2 outline-none focus:border-indigo-500 cursor-pointer"
           >
              <option value="current_month">Mês Atual</option>
              <option value="all_time">Todo o Período</option>
           </select>
        </div>
      </header>`;

content = content.replace(dashHeaderEndOld, dashHeaderEndNew);

fs.writeFileSync(path, content);
