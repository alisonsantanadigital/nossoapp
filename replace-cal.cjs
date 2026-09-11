const fs = require('fs');
const path = './src/pages/CalendarView.tsx';

let content = fs.readFileSync(path, 'utf8');

// Need to import doc, updateDoc
if (!content.includes('updateDoc')) {
  content = content.replace('collection, query, where, onSnapshot', 'collection, query, where, onSnapshot, doc, updateDoc');
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
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar o status do lançamento.");
    }
  };
`;

// Insert the toggle function before onDateClick
if (!content.includes('toggleTransactionStatus')) {
  content = content.replace('const onDateClick =', toggleFunc + '\n  const onDateClick =');
}

// Update the transaction row
content = content.replace(
  'className="py-3 flex items-center justify-between group"',
  `onDoubleClick={() => toggleTransactionStatus(tx)}
                  className={\`py-3 px-4 -mx-4 rounded-2xl flex items-center justify-between group cursor-pointer select-none transition-colors \${
                    tx.status === "completed"
                      ? tx.type === "expense"
                        ? "bg-rose-500/10 hover:bg-rose-500/15"
                        : "bg-emerald-500/10 hover:bg-emerald-500/15"
                      : "hover:bg-white/[0.04]"
                  }\`}`
);

fs.writeFileSync(path, content);
