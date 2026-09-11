const fs = require('fs');
const path = require('path');

let btnPath = './src/components/ui/Button.tsx';
let btnContent = fs.readFileSync(btnPath, 'utf8');
btnContent = btnContent.replace('bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20', 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-indigo-500/25');
btnContent = btnContent.replace(/rounded-3xl/g, 'rounded-full'); // Buttons as pills
fs.writeFileSync(btnPath, btnContent);

let inputPath = './src/components/ui/Input.tsx';
let inputContent = fs.readFileSync(inputPath, 'utf8');
inputContent = inputContent.replace('bg-white', 'bg-[#151E2E]');
inputContent = inputContent.replace(/rounded-2xl/g, 'rounded-2xl'); 
fs.writeFileSync(inputPath, inputContent);
