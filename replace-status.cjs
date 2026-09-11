const fs = require('fs');
const path = './src/pages/Transactions.tsx';

let content = fs.readFileSync(path, 'utf8');

const toggleFunc = `
  const toggleTransactionStatus = async (tx: Transaction) => {
    if (!navigator.onLine) {
      alert("Sem conexão com a internet.");
      return;
    }
    try {
      const newStatus = tx.status === "completed" ? "pending" : "completed";
      await updateDoc(doc(db, "transactions", tx.id), {
        status: newStatus
      });
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar o status do lançamento.");
    }
  };
`;

// Insert the toggle function before handleAddTransaction
content = content.replace('const handleAddTransaction = async', toggleFunc + '\n  const handleAddTransaction = async');

// Update the transaction row
content = content.replace(
  'className="p-4 sm:px-6 flex items-center justify-between hover:bg-white/[0.04] transition-colors group"',
  `onDoubleClick={() => toggleTransactionStatus(tx)}
                      className={\`p-4 sm:px-6 flex items-center justify-between transition-colors group cursor-pointer select-none \${
                        tx.status === "completed"
                          ? tx.type === "expense"
                            ? "bg-rose-500/10 hover:bg-rose-500/15"
                            : "bg-emerald-500/10 hover:bg-emerald-500/15"
                          : "hover:bg-white/[0.04]"
                      }\`}`
);

fs.writeFileSync(path, content);
