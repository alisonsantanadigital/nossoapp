const fs = require('fs');
const path = './src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'Receipt,',
  'Receipt,\n  User as UserIcon,'
);

fs.writeFileSync(path, content);
