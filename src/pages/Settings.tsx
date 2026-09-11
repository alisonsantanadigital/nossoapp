import React, { useState, useEffect, useRef } from "react";
import { updatePassword, signOut, createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  addDoc,
  Timestamp,
  deleteDoc,
  query,
  where,
  getDoc
} from "firebase/firestore";
import { auth, db, firebaseConfig } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useOrg } from "../contexts/OrgContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { legacyTransactions } from "../lib/legacyData";
import { Camera, User as UserIcon, Download, Upload } from "lucide-react";
import type { UserProfile } from "../types";

export function Settings() {
  const { userProfile, user, refreshProfile } = useAuth();
  const { organization } = useOrg();

  // Profile Edit State
  const [profileName, setProfileName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });
  const [loadingPwd, setLoadingPwd] = useState(false);

  // Migration state
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationMsg, setMigrationMsg] = useState("");

  // Clear data state
  const [isClearing, setIsClearing] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupMsg, setBackupMsg] = useState("");
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(localStorage.getItem("lastBackupDate"));
  const restoreFileRef = useRef<HTMLInputElement>(null);
  const [clearMsg, setClearMsg] = useState("");

  // Admin state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Add user state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [loadingAddUser, setLoadingAddUser] = useState(false);
  const [addUserMsg, setAddUserMsg] = useState("");

  useEffect(() => {
    if (userProfile?.appRole === "admin") {
      fetchUsers();
    }
  }, [userProfile?.appRole]);

  useEffect(() => {
    if (userProfile) {
      setProfileName(userProfile.displayName || "");
      setProfilePhoto(userProfile.photoURL || "");
    }
  }, [userProfile]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const usersData = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserProfile[];
      setUsers(usersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setLoadingProfile(true);
    setProfileMsg({ type: "", text: "" });

    try {
      await updateDoc(doc(db, "users", userProfile.id), {
        displayName: profileName,
        photoURL: profilePhoto,
      });
      await refreshProfile();
      setProfileMsg({
        type: "success",
        text: "Perfil atualizado com sucesso!",
      });
    } catch (err) {
      console.error(err);
      setProfileMsg({ type: "error", text: "Erro ao atualizar perfil." });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProfilePhoto(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoadingPwd(true);
    setPasswordMsg({ type: "", text: "" });

    try {
      await updatePassword(auth.currentUser, newPassword);
      setPasswordMsg({
        type: "success",
        text: "Senha atualizada com sucesso!",
      });
      setNewPassword("");
    } catch (err: any) {
      if (err.code === "auth/requires-recent-login") {
        setPasswordMsg({
          type: "error",
          text: "Por segurança, você precisa sair e fazer login novamente para mudar a senha.",
        });
      } else {
        setPasswordMsg({ type: "error", text: "Erro ao atualizar senha." });
      }
    } finally {
      setLoadingPwd(false);
    }
  };

  const toggleUserStatus = async (
    uid: string,
    currentStatus: string | undefined,
  ) => {
    try {
      const newStatus = currentStatus === "inactive" ? "active" : "inactive";
      await updateDoc(doc(db, "users", uid), { status: newStatus });
      setUsers(
        users.map((u) => (u.id === uid ? { ...u, status: newStatus } : u)),
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar status do usuário.");
    }
  };

  const usernameToEmail = (username: string) => {
    return `${username.toLowerCase().trim()}@flowcontrol.app`;
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;
    
    if (!/^[a-zA-Z0-9_]+$/.test(newUserUsername)) {
      setAddUserMsg("O usuário deve conter apenas letras, números e underlines.");
      return;
    }

    setLoadingAddUser(true);
    setAddUserMsg("");

    try {
      // Create a secondary app instance to create the user without logging out the admin
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);
      
      const email = usernameToEmail(newUserUsername);
      const { user: newUser } = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        newUserPassword
      );

      // Create the user profile in Firestore
      await setDoc(doc(db, "users", newUser.uid), {
        displayName: newUserName,
        username: newUserUsername.toLowerCase(),
        email: email,
        preferences: {},
        status: "active",
        appRole: "user",
        currentOrganizationId: organization.id,
      });

      // Add to organization members
      const orgRef = doc(db, "organizations", organization.id);
      const orgSnap = await getDoc(orgRef);
      if (orgSnap.exists()) {
        const orgData = orgSnap.data();
        const updatedMembers = { ...orgData.members, [newUser.uid]: "member" };
        await updateDoc(orgRef, { members: updatedMembers });
      }

      // Sign out and delete secondary app to clean up
      await signOut(secondaryAuth);
      
      setAddUserMsg("Usuário criado com sucesso!");
      setIsAddUserOpen(false);
      setNewUserName("");
      setNewUserUsername("");
      setNewUserPassword("");
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setAddUserMsg("Este nome de usuário já está em uso.");
      } else {
        setAddUserMsg(err.message || "Erro ao criar usuário.");
      }
    } finally {
      setLoadingAddUser(false);
    }
  };

  const handleMigration = async () => {
    if (!organization) return;
    if (
      !confirm(
        "Deseja importar os dados históricos das planilhas antigas? ISSO NÃO PODE SER DESFEITO.",
      )
    ) {
      return;
    }
    setIsMigrating(true);
    setMigrationMsg("");
    try {
      let count = 0;
      for (const tx of legacyTransactions) {
        const parts = tx.date.split("-");
        const dateObj = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2]),
          12,
          0,
          0,
        );
        await addDoc(collection(db, "transactions"), {
          amount: tx.amount,
          date: Timestamp.fromDate(dateObj),
          description: tx.description,
          emoji: tx.emoji,
          type: tx.type,
          orgId: organization.id,
          addedBy: userProfile?.id,
          createdAt: Timestamp.now(),
        });
        count++;
      }
      setMigrationMsg(`Sucesso! ${count} registros foram importados.`);
    } catch (err) {
      console.error(err);
      setMigrationMsg("Erro ao importar os dados históricos.");
    } finally {
      setIsMigrating(false);
    }
  };

  const handleClearData = async () => {
    if (!organization?.id) return;
    
    if (!window.confirm("ATENÇÃO: Você tem certeza que deseja apagar TODOS os seus lançamentos e metas? Esta ação não pode ser desfeita.")) {
      return;
    }
    setIsClearing(true);
    setClearMsg("");
    
    try {
      const collectionsToClear = ["transactions", "goals", "wishlist"];
      let totalDeleted = 0;
      
      for (const collName of collectionsToClear) {
        const q = query(collection(db, collName), where("orgId", "==", organization.id));
        const snapshot = await getDocs(q);
        
        const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, collName, docSnap.id)));
        await Promise.all(deletePromises);
        
        totalDeleted += snapshot.size;
      }
      
      setClearMsg(`Sucesso! ${totalDeleted} registros foram apagados definitivamente.`);
    } catch (err) {
      console.error(err);
      setClearMsg("Erro ao tentar apagar os dados.");
    } finally {
      setIsClearing(false);
    }
  };


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
      downloadAnchorNode.setAttribute("download", `flowcontrol_backup_${new Date().toISOString().split('T')[0]}.json`);
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
        
        setBackupMsg(`Sucesso! ${count} registros foram restaurados.`);
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

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Configurações
        </h1>
        <p className="text-slate-400 mt-1">
          Gerencie sua conta e preferências.
        </p>
      </div>

      <div className="bg-[#151E2E] p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-white/5">
        <h2 className="text-lg font-semibold text-white mb-4">Meu Perfil</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div 
              className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-10 h-10 text-slate-400" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />
            <div className="flex-1 w-full max-w-sm space-y-4">
              <Input
                label="Nome de Exibição"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
              />
              <Input
                label="Nome de Usuário"
                value={userProfile?.username || ""}
                disabled
                className="opacity-50 cursor-not-allowed"
              />
            </div>
          </div>
          {profileMsg.text && (
            <p
              className={`text-sm ${profileMsg.type === "success" ? "text-indigo-400" : "text-rose-400"}`}
            >
              {profileMsg.text}
            </p>
          )}
          <Button type="submit" loading={loadingProfile}>
            Salvar Perfil
          </Button>
        </form>
      </div>

      {userProfile?.appRole === "admin" && (
        <div className="bg-[#151E2E] p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Administração de Usuários
            </h2>
            <Button onClick={() => setIsAddUserOpen(true)} size="sm">
              Novo Usuário
            </Button>
          </div>
          <div className="divide-y divide-white/5">
            {loadingUsers ? (
              <p className="text-sm text-slate-400">Carregando...</p>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  className="py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {u.displayName} (@{u.username})
                      </p>
                      <p className="text-sm text-slate-400">
                        {u.appRole === "admin"
                          ? "Administrador"
                          : "Usuário padrão"}
                      </p>
                    </div>
                  </div>
                  {u.id !== userProfile.id && (
                    <Button
                      variant={u.status === "inactive" ? "outline" : "ghost"}
                      onClick={() => toggleUserStatus(u.id, u.status)}
                      className={
                        u.status === "inactive"
                          ? "text-indigo-400"
                          : "text-rose-400 hover:text-rose-500 hover:bg-rose-500/10"
                      }
                    >
                      {u.status === "inactive"
                        ? "Ativar Acesso"
                        : "Desativar Acesso"}
                    </Button>
                  )}
                  {u.id === userProfile.id && (
                    <span className="text-sm text-slate-400 font-medium px-4">
                      Você
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="bg-[#151E2E] p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-white/5">
        <h2 className="text-lg font-semibold text-white mb-4">Alterar Senha</h2>
        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
          <Input
            label="Nova Senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          {passwordMsg.text && (
            <p
              className={`text-sm ${passwordMsg.type === "success" ? "text-indigo-400" : "text-rose-400"}`}
            >
              {passwordMsg.text}
            </p>
          )}
          <Button type="submit" loading={loadingPwd}>
            Atualizar Senha
          </Button>
        </form>
      </div>

      <div className="bg-[#151E2E] p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-white/5">
        <h2 className="text-lg font-semibold text-white mb-4">
          Migração de Dados
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Importe seus registros históricos (imagens do WhatsApp) para o
          sistema. Isso os transformará em dados estruturados e editáveis.
        </p>
        <Button
          onClick={handleMigration}
          loading={isMigrating}
          variant="outline"
          className="border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10"
        >
          Migrar Registros Históricos
        </Button>
        {migrationMsg && (
          <p className="text-sm text-indigo-400 mt-2">{migrationMsg}</p>
        )}
      </div>


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
          <p className={`text-sm mt-4 ${backupMsg.includes("Erro") ? "text-rose-400" : "text-emerald-400"}`}>
            {backupMsg}
          </p>
        )}
      </div>


      <div className="bg-[#151E2E] p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-white/5">
        <h2 className="text-lg font-semibold text-red-600 mb-4">
          Zona de Perigo
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Esta ação apagará <strong>todos</strong> os seus dados (lançamentos, metas e desejos) do sistema.
          Não pode ser desfeita. Use com cautela.
        </p>
        <Button
          onClick={handleClearData}
          loading={isClearing}
          variant="outline"
          className="border-red-500/20 text-red-600 hover:bg-red-500/10 hover:text-red-700"
        >
          Limpar Todos os Dados
        </Button>
        {clearMsg && (
          <p className="text-sm text-red-600 mt-2">{clearMsg}</p>
        )}
      </div>

      <div className="pt-4 border-t border-white/5">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="text-rose-400 border-rose-500/20 hover:bg-rose-500/10"
        >
          Sair do Sistema
        </Button>
      </div>

      <Modal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        title="Novo Usuário"
      >
        <form onSubmit={handleAddUser} className="space-y-4 mt-4">
          <Input
            label="Nome"
            placeholder="Nome da pessoa"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            required
          />
          <Input
            label="Nome de Usuário"
            placeholder="Ex: joao"
            value={newUserUsername}
            onChange={(e) => setNewUserUsername(e.target.value)}
            required
          />
          <Input
            label="Senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
            required
            minLength={6}
          />
          {addUserMsg && (
            <p className="text-sm text-rose-400">
              {addUserMsg}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddUserOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loadingAddUser}>
              Criar Usuário
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
