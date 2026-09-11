const fs = require('fs');
const path = './src/pages/Transactions.tsx';
let content = fs.readFileSync(path, 'utf8');

// header
content = content.replace('gap-4 mb-8', 'gap-3 mb-4');
content = content.replace('text-2xl font-bold', 'text-xl font-bold');
content = content.replace('text-slate-400 mt-1', 'text-slate-400 text-sm');

// list items
content = content.replace(/p-4 sm:px-6/g, 'p-3 sm:px-4');
content = content.replace(/w-12 h-12 rounded-3xl/g, 'w-10 h-10 rounded-2xl');

fs.writeFileSync(path, content);
