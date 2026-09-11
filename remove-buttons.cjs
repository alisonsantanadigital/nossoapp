const fs = require('fs');
const pathLayout = './src/components/Layout.tsx';
let contentLayout = fs.readFileSync(pathLayout, 'utf8');

contentLayout = contentLayout.replace(
  '{ label: "Despesas", icon: CreditCard, path: "/transactions" },',
  '{ label: "Lançamentos", icon: CreditCard, path: "/transactions" },'
);

fs.writeFileSync(pathLayout, contentLayout);

const pathDash = './src/pages/Dashboard.tsx';
let contentDash = fs.readFileSync(pathDash, 'utf8');

const regex = /<div className="flex gap-2">[\s\S]*?<\/div>\s*<\/header>/;
contentDash = contentDash.replace(regex, '</header>');

fs.writeFileSync(pathDash, contentDash);
