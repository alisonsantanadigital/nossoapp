const fs = require('fs');
const path = './src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /const toggleTransactionStatus = async \([\s\S]*?alert\("Erro ao atualizar o status do lançamento\."\);\n    }\n  };\n/g;

content = content.replace(regex, '');

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

content = content.replace('  const currentMonth = ', toggleFunc + '\n  const currentMonth = ');
fs.writeFileSync(path, content);
