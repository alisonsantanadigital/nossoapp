const fs = require('fs');
const path = './src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Header adjustments
content = content.replace('gap-4 mb-8', 'gap-3 mb-4');
content = content.replace('w-12 h-12 md:w-16 md:h-16', 'w-10 h-10 md:w-12 md:h-12');
content = content.replace('text-2xl md:text-3xl font-bold', 'text-xl md:text-2xl font-bold');
content = content.replace('text-slate-400 mt-1', 'text-slate-400 text-sm');

// Hero card adjustments
content = content.replace('rounded-3xl p-6 text-white', 'rounded-2xl p-4 text-white');
content = content.replace('space-y-6', 'space-y-4');
content = content.replace('mb-2 opacity-90', 'mb-1 text-sm opacity-90');
content = content.replace('text-4xl md:text-5xl font-bold', 'text-3xl md:text-4xl font-bold');
content = content.replace('text-sm opacity-90', 'text-xs opacity-90');

// Small cards (Incomes, Expenses, Saved)
content = content.replace(/<Card>/g, '<Card className="rounded-2xl">');
content = content.replace(/p-6/g, 'p-4');
content = content.replace(/w-12 h-12 rounded-2xl/g, 'w-10 h-10 rounded-xl');
content = content.replace(/text-2xl font-bold mt-2/g, 'text-lg font-bold mt-1');
content = content.replace(/gap-6/g, 'gap-4');
content = content.replace(/mt-8/g, 'mt-4');

fs.writeFileSync(path, content);
