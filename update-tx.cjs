const fs = require('fs');
const path = './src/pages/Transactions.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldHeader = `<div className="flex gap-4 text-sm">
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Entradas</span>
                    <span className="text-emerald-400 font-medium">
                      +{formatCurrency(group.income)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Saídas</span>
                    <span className="text-rose-400 font-medium">
                      -{formatCurrency(group.expense)}
                    </span>
                  </div>
                </div>`;

const newHeader = `<div className="flex gap-3 sm:gap-4 text-sm">
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
                    <span className={\`font-medium text-xs sm:text-sm \${group.income - group.expense >= 0 ? 'text-indigo-400' : 'text-rose-400'}\`}>
                      {formatCurrency(group.income - group.expense)}
                    </span>
                  </div>
                </div>`;

content = content.replace(oldHeader, newHeader);
fs.writeFileSync(path, content);
