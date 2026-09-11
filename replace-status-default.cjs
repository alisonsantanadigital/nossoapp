const fs = require('fs');
const path = './src/pages/Transactions.tsx';

let content = fs.readFileSync(path, 'utf8');

// Replace status: "completed" with a smart date check during creation
content = content.replace(
  'status: "completed",',
  'status: installmentDate <= new Date() ? "completed" : "pending",'
);

content = content.replace(
  'status: "completed",',
  'status: baseDate <= new Date() ? "completed" : "pending",'
);

fs.writeFileSync(path, content);
