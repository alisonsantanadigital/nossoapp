const fs = require('fs');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [oldStr, newStr] of replacements) {
    content = content.split(oldStr).join(newStr);
  }
  fs.writeFileSync(filePath, content);
}

// 1. Login.tsx
replaceInFile('./src/pages/Login.tsx', [
  ['Bem-vindo à Nossa Casa', 'Bem-vindo ao FlowControl'],
  ['@nossacasa.app', '@flowcontrol.app']
]);

// 2. Settings.tsx
replaceInFile('./src/pages/Settings.tsx', [
  ['@nossacasa.app', '@flowcontrol.app']
]);

// 3. Onboarding.tsx
replaceInFile('./src/pages/Onboarding.tsx', [
  ['useState("Nossa Casa")', 'useState("FlowControl")'],
  ['Ex: Família Silva, Nossa Casa...', 'Ex: Minhas Finanças, FlowControl...']
]);

// 4. Layout.tsx
let layoutContent = fs.readFileSync('./src/components/Layout.tsx', 'utf8');
layoutContent = layoutContent.replace('Nossa Casa', 'FlowControl');

// Change icon from Home to Hexagon for the logo in Layout
if (!layoutContent.includes('Hexagon,')) {
    layoutContent = layoutContent.replace('Home,', 'Home,\n  Hexagon,');
}
layoutContent = layoutContent.replace(
  '<Home className="w-5 h-5 text-white" />', 
  '<Hexagon className="w-5 h-5 text-white" />'
);

fs.writeFileSync('./src/components/Layout.tsx', layoutContent);

// 5. index.html
replaceInFile('./index.html', [
  ['Nossa Casa - Gestão Financeira Familiar', 'FlowControl - Gestão Financeira'],
  ['Nossa Casa', 'FlowControl']
]);

// 6. metadata.json
replaceInFile('./metadata.json', [
  ['"name": "Nossa Casa"', '"name": "FlowControl"']
]);

console.log('Renaming complete');
