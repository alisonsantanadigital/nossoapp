const fs = require('fs');

// 1. Fix Modal z-index and padding
const modalPath = './src/components/ui/Modal.tsx';
let modalContent = fs.readFileSync(modalPath, 'utf8');

modalContent = modalContent.replace(
  'className="fixed inset-0 z-50 flex items-center justify-center',
  'className="fixed inset-0 z-[100] flex items-center justify-center'
);

modalContent = modalContent.replace(
  '<div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>',
  '<div className="p-6 pb-12 max-h-[85vh] overflow-y-auto">{children}</div>'
);

fs.writeFileSync(modalPath, modalContent);

// 2. Fix Layout main padding
const layoutPath = './src/components/Layout.tsx';
let layoutContent = fs.readFileSync(layoutPath, 'utf8');

layoutContent = layoutContent.replace(
  'className="flex-1 md:ml-64 pb-24 md:pb-0"',
  'className="flex-1 md:ml-64 pb-32 md:pb-0"'
);

fs.writeFileSync(layoutPath, layoutContent);

console.log('Fixed padding and z-index');
