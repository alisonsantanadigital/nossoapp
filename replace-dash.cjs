const fs = require('fs');
const path = './src/pages/Dashboard.tsx';

let content = fs.readFileSync(path, 'utf8');

// Need to import doc, updateDoc
if (!content.includes('updateDoc')) {
  content = content.replace('collection, query, where, getDocs', 'collection, query, where, getDocs, doc, updateDoc');
}

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
      // Update local state to reflect change immediately on dashboard
      setTransactions(prev => prev.map(t => t.id === tx.id ? { ...t, status: newStatus } : t));
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar o status do lançamento.");
    }
  };
`;

// Insert the toggle function before return
if (!content.includes('toggleTransactionStatus')) {
  content = content.replace('  return (', toggleFunc + '\n  return (');
}

// Update the transaction row
content = content.replace(
  'className="p-4 flex items-center justify-between hover:bg-white/[0.04] transition-colors"',
  `onDoubleClick={() => toggleTransactionStatus(tx)}
                    className={\`p-4 flex items-center justify-between transition-colors cursor-pointer select-none \${
                      tx.status === "completed"
                        ? tx.type === "expense"
                          ? "bg-rose-500/10 hover:bg-rose-500/15"
                          : "bg-emerald-500/10 hover:bg-emerald-500/15"
                        : "hover:bg-white/[0.04]"
                    }\`}`
);

fs.writeFileSync(path, content);
