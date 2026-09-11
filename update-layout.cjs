const fs = require('fs');
const path = './src/components/Layout.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update main layout classes for h-screen
content = content.replace(
  'className="min-h-screen bg-[#090E17] flex flex-col md:flex-row font-sans text-white"',
  'className="h-screen bg-[#090E17] flex flex-col md:flex-row font-sans text-white overflow-hidden"'
);

// Update Main Content area to be a scrollable flex container
content = content.replace(
  '<main className="flex-1 md:ml-64 pb-32 md:pb-0">',
  '<main className="flex-1 md:ml-64 flex flex-col h-full relative overflow-hidden">\n        <div className="flex-1 overflow-y-auto pb-32 md:pb-8 p-4 md:p-6">'
);
content = content.replace(
  '        <div className="max-w-5xl mx-auto p-4 md:p-8">\n          <Outlet />\n        </div>\n      </main>',
  '          <div className="max-w-5xl mx-auto w-full">\n            <Outlet />\n          </div>\n        </div>\n      </main>'
);

// Make the FAB point to ?new=true
content = content.replace(
  '<Link to="/transactions" className="w-14 h-14 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-sky-500/30 active:scale-95 transition-transform">',
  '<Link to="/transactions?new=true" className="w-14 h-14 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-sky-500/30 active:scale-95 transition-transform">'
);

fs.writeFileSync(path, content);
