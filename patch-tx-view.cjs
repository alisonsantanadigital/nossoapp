const fs = require('fs');
const path = './src/pages/Transactions.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add view state
content = content.replace(
  'const [isModalOpen, setIsModalOpen] = useState(false);',
  'const [isModalOpen, setIsModalOpen] = useState(false);\n  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);'
);

// 2. Change row click handler
content = content.replace(
  'className={`p-4 sm:px-6 flex items-center justify-between transition-colors group cursor-pointer select-none ${',
  'onClick={() => setViewingTx(tx)}\n                      className={`p-4 sm:px-6 flex items-center justify-between transition-colors group cursor-pointer select-none ${'
);

// 3. Add View Modal
const viewModalCode = `
      <Modal
        isOpen={!!viewingTx}
        onClose={() => setViewingTx(null)}
        title="Detalhes do Lançamento"
      >
        {viewingTx && (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-6 bg-white/5 rounded-3xl border border-white/5">
               <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-4xl mb-4 overflow-hidden border border-white/10">
                  {viewingTx.imageUrl ? (
                    <img src={viewingTx.imageUrl} alt={viewingTx.description} className="w-full h-full object-cover" />
                  ) : (
                    viewingTx.emoji || (viewingTx.type === "expense" ? "💸" : "💰")
                  )}
               </div>
               <h2 className="text-2xl font-bold text-white text-center px-4">{viewingTx.description}</h2>
               <p className={\`text-3xl font-bold mt-2 \${viewingTx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}\`}>
                 {viewingTx.type === 'income' ? '+' : '-'} {formatCurrency(viewingTx.amount)}
               </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-slate-400">Status</span>
                <span className={\`font-medium px-3 py-1 rounded-full text-sm \${
                  viewingTx.status === "completed"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-500"
                }\`}>
                  {viewingTx.status === "completed" ? "Pago/Recebido" : "Pendente"}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-slate-400">Data</span>
                <span className="text-white font-medium">{viewingTx.date.toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-slate-400">Tipo</span>
                <span className="text-white font-medium capitalize">{viewingTx.type === 'income' ? 'Receita' : 'Despesa'}</span>
              </div>
              {viewingTx.isFixed && (
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-slate-400">Recorrência</span>
                  <span className="text-amber-400 font-medium">Despesa Fixa</span>
                </div>
              )}
              {viewingTx.installmentInfo && (
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-slate-400">Parcelamento</span>
                  <span className="text-indigo-400 font-medium">{viewingTx.installmentInfo}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
               <Button 
                 variant="outline" 
                 className="flex-1"
                 onClick={() => setViewingTx(null)}
               >
                 Fechar
               </Button>
               <Button 
                 className="flex-1"
                 onClick={() => {
                   setViewingTx(null);
                   openEditModal(viewingTx);
                 }}
               >
                 <Edit2 className="w-4 h-4 mr-2" />
                 Editar
               </Button>
            </div>
          </div>
        )}
      </Modal>
`;

content = content.replace(
  '      <Modal\n        isOpen={isModalOpen}',
  viewModalCode + '\n      <Modal\n        isOpen={isModalOpen}'
);

fs.writeFileSync(path, content);
