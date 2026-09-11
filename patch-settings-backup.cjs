const fs = require('fs');
const path = './src/pages/Settings.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import { Download, Upload } from "lucide-react"')) {
  content = content.replace(
    'import { Camera, User as UserIcon } from "lucide-react";',
    'import { Camera, User as UserIcon, Download, Upload } from "lucide-react";'
  );
}

// 1. Add backup state
if (!content.includes('const [isBackingUp, setIsBackingUp] = useState(false);')) {
  content = content.replace(
    '  const [isClearing, setIsClearing] = useState(false);',
    '  const [isClearing, setIsClearing] = useState(false);\n  const [isBackingUp, setIsBackingUp] = useState(false);\n  const [isRestoring, setIsRestoring] = useState(false);\n  const [backupMsg, setBackupMsg] = useState("");\n  const [lastBackupDate, setLastBackupDate] = useState<string | null>(localStorage.getItem("lastBackupDate"));\n  const restoreFileRef = useRef<HTMLInputElement>(null);'
  );
}

// 2. Add backup functions
const backupCode = `
  const handleExportBackup = async () => {
    if (!organization) return;
    setIsBackingUp(true);
    setBackupMsg("");
    try {
      // Fetch all data
      const txSnap = await getDocs(query(collection(db, "transactions"), where("orgId", "==", organization.id)));
      const goalsSnap = await getDocs(query(collection(db, "goals"), where("orgId", "==", organization.id)));
      const wishlistSnap = await getDocs(query(collection(db, "wishlist"), where("orgId", "==", organization.id)));
      
      const backupData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        organization: organization,
        transactions: txSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        goals: goalsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        wishlist: wishlistSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", \`flowcontrol_backup_\${new Date().toISOString().split('T')[0]}.json\`);
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      
      const dateStr = new Date().toLocaleString("pt-BR");
      localStorage.setItem("lastBackupDate", dateStr);
      setLastBackupDate(dateStr);
      setBackupMsg("Backup concluído e baixado com sucesso!");
    } catch (err) {
      console.error(err);
      setBackupMsg("Erro ao gerar o backup.");
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization) return;
    
    if (!window.confirm("ATENÇÃO: Restaurar um backup irá mesclar/sobrescrever seus dados atuais. Deseja continuar?")) {
      if (restoreFileRef.current) restoreFileRef.current.value = "";
      return;
    }

    setIsRestoring(true);
    setBackupMsg("Lendo arquivo...");
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const backupData = JSON.parse(content);
        
        if (!backupData.transactions || !backupData.version) {
          throw new Error("Arquivo de backup inválido.");
        }
        
        setBackupMsg("Restaurando lançamentos...");
        let count = 0;
        // Import transactions
        for (const tx of backupData.transactions) {
           // Basic check to see if it exists, or just use setDoc with its ID
           const txRef = doc(db, "transactions", tx.id);
           // Restore Timestamp objects if they were serialized
           let dateToSave = tx.date;
           if (tx.date && tx.date.seconds) {
             dateToSave = new Timestamp(tx.date.seconds, tx.date.nanoseconds);
           } else if (tx.date && typeof tx.date === 'string') {
             dateToSave = Timestamp.fromDate(new Date(tx.date));
           }
           
           let createdToSave = tx.createdAt;
           if (tx.createdAt && tx.createdAt.seconds) {
             createdToSave = new Timestamp(tx.createdAt.seconds, tx.createdAt.nanoseconds);
           }
           
           await setDoc(txRef, {
             ...tx,
             orgId: organization.id, // force current org
             date: dateToSave,
             createdAt: createdToSave
           });
           count++;
        }
        
        setBackupMsg(\`Sucesso! \${count} registros foram restaurados.\`);
      } catch (err: any) {
        console.error(err);
        setBackupMsg("Erro ao restaurar: " + err.message);
      } finally {
        setIsRestoring(false);
        if (restoreFileRef.current) restoreFileRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };
`;

if (!content.includes('handleExportBackup')) {
  content = content.replace(
    '  const handleLogout = async () => {',
    backupCode + '\n  const handleLogout = async () => {'
  );
}

// 3. Add Backup UI
const backupUI = `
      <div className="bg-[#151E2E] p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <Download className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">Backup e Restauração</h2>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Proteja seus dados. Exporte um arquivo com todos os seus lançamentos e configurações, 
          ou restaure um backup anterior caso tenha trocado de aparelho.
        </p>
        
        {lastBackupDate && (
          <p className="text-sm text-slate-300 mb-4 bg-white/5 p-3 rounded-xl border border-white/10">
            <strong>Último backup:</strong> {lastBackupDate}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleExportBackup}
            loading={isBackingUp}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Fazer Backup Agora
          </Button>
          
          <input 
            type="file" 
            ref={restoreFileRef} 
            onChange={handleImportBackup} 
            accept=".json" 
            className="hidden" 
          />
          <Button
            onClick={() => restoreFileRef.current?.click()}
            loading={isRestoring}
            variant="outline"
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Restaurar Backup
          </Button>
        </div>
        
        {backupMsg && (
          <p className={\`text-sm mt-4 \${backupMsg.includes("Erro") ? "text-rose-400" : "text-emerald-400"}\`}>
            {backupMsg}
          </p>
        )}
      </div>
`;

if (!content.includes('Backup e Restauração')) {
  content = content.replace(
    '      <div className="bg-[#151E2E] p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-white/5">\n        <h2 className="text-lg font-semibold text-red-600 mb-4">\n          Zona de Perigo',
    backupUI + '\n\n      <div className="bg-[#151E2E] p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-white/5">\n        <h2 className="text-lg font-semibold text-red-600 mb-4">\n          Zona de Perigo'
  );
}

fs.writeFileSync(path, content);
