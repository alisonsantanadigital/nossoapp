const fs = require('fs');
const path = './src/components/Layout.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '<div className="flex-1 overflow-y-auto pb-32 md:pb-8 p-4 md:p-6">',
  '<div className="flex-1 overflow-y-auto pb-24 md:pb-4 p-3 md:p-4">'
);

fs.writeFileSync(path, content);
