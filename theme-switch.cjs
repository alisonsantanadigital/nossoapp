const fs = require('fs');
const path = require('path');

const directory = './src';

const replacements = [
  { from: /bg-slate-50/g, to: 'bg-[#090E17]' },
  { from: /bg-white/g, to: 'bg-[#151E2E]' },
  { from: /text-slate-900/g, to: 'text-white' },
  { from: /text-slate-800/g, to: 'text-slate-100' },
  { from: /text-slate-700/g, to: 'text-slate-200' },
  { from: /text-slate-600/g, to: 'text-slate-300' },
  { from: /text-slate-500/g, to: 'text-slate-400' },
  { from: /border-slate-200/g, to: 'border-white/5' },
  { from: /border-slate-300/g, to: 'border-white/10' },
  { from: /hover:bg-slate-50/g, to: 'hover:bg-white/[0.02]' },
  { from: /hover:bg-slate-100/g, to: 'hover:bg-white/[0.04]' },
  { from: /bg-slate-100/g, to: 'bg-white/5' },
  { from: /bg-slate-200/g, to: 'bg-white/10' },
  { from: /divide-slate-200/g, to: 'divide-white/5' },
  { from: /ring-slate-200/g, to: 'ring-white/10' },
  { from: /placeholder:text-slate-400/g, to: 'placeholder:text-slate-500' },
  // specific finesse updates
  { from: /rounded-xl/g, to: 'rounded-2xl' },
  { from: /rounded-2xl/g, to: 'rounded-3xl' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const { from, to } of replacements) {
        content = content.replace(from, to);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(directory);
