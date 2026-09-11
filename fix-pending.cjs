const fs = require('fs');
const path = './src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'const pendingBills = transactions\n    .filter((t) => t.status === "pending")\n    .reduce((acc, t) => acc + t.amount, 0);',
  'const pendingBills = transactions\n    .filter((t) => t.status === "pending" && t.type === "expense")\n    .reduce((acc, t) => acc + t.amount, 0);'
);

fs.writeFileSync(path, content);
