const fs = require('fs');
const path = require('path');

let dashPath = './src/pages/Dashboard.tsx';
let content = fs.readFileSync(dashPath, 'utf8');

// Update Hero card background
content = content.replace('bg-sky-500 rounded-2xl p-6 text-white shadow-lg shadow-sky-500/20', 'bg-gradient-to-br from-indigo-900 to-[#0B1121] border border-white/5 rounded-3xl p-6 text-white shadow-xl shadow-black/40');
// The inner elements bg-[#151E2E]/20 -> bg-white/5
content = content.replace(/bg-\[\#151E2E\]\/20/g, 'bg-white/5');
content = content.replace(/bg-\[\#151E2E\]\/30/g, 'bg-white/10');
content = content.replace(/rounded-2xl/g, 'rounded-3xl');

fs.writeFileSync(dashPath, content);
