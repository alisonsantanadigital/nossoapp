import React, { useState, useEffect } from "react";
import { updatePassword, signOut } from "firebase/auth";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useOrg } from "../contexts/OrgContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { legacyTransactions } from "../lib/legacyData";
import type { UserProfile } from "../types";

export function Settings() {
  const { userProfile, user } = useAuth();
  const { organization } = useOrg();

  // Password change state
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });
  const [loadingPwd, setLoadingPwd] = useState(false);

  // Migration state
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationMsg, setMigrationMsg] = useState("");

  // Admin state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (userProfile?.appRole === "admin") {
      fetchUsers();
    }
  }, [userProfile?.appRole]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      setUsers(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as UserProfile),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPassword) return;
    setLoadingPwd(true);
    try {
      await updatePassword(user, newPassword);
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
        // Parse date
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

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Configurações
        </h1>
        <p className="text-slate-500 mt-1">
          Gerencie sua conta e preferências.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Migração de Dados
        </h2>
        <p className="text-slate-500 text-sm mb-4">
          Importe seus registros históricos (imagens do WhatsApp) para o
          sistema. Isso os transformará em dados estruturados e editáveis.
        </p>
        <Button
          onClick={handleMigration}
          loading={isMigrating}
          variant="outline"
          className="border-sky-500/20 text-sky-600 hover:bg-sky-500/10"
        >
          Migrar Registros Históricos
        </Button>
        {migrationMsg && (
          <p className="text-sm text-sky-600 mt-2">{migrationMsg}</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Alterar Senha</h2>
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
              className={`text-sm ${passwordMsg.type === "success" ? "text-sky-600" : "text-rose-400"}`}
            >
              {passwordMsg.text}
            </p>
          )}
          <Button type="submit" loading={loadingPwd}>
            Atualizar Senha
          </Button>
        </form>
      </div>

      {userProfile?.appRole === "admin" && (
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Administração de Usuários
          </h2>
          <div className="divide-y divide-slate-200">
            {loadingUsers ? (
              <p className="text-sm text-slate-500">Carregando...</p>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  className="py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {u.displayName} (@{u.username})
                    </p>
                    <p className="text-sm text-slate-500">
                      {u.appRole === "admin"
                        ? "Administrador"
                        : "Usuário padrão"}
                    </p>
                  </div>
                  {u.id !== userProfile.id && (
                    <Button
                      variant={u.status === "inactive" ? "outline" : "ghost"}
                      onClick={() => toggleUserStatus(u.id, u.status)}
                      className={
                        u.status === "inactive"
                          ? "text-sky-600"
                          : "text-rose-400 hover:text-rose-500 hover:bg-rose-500/10"
                      }
                    >
                      {u.status === "inactive"
                        ? "Ativar Acesso"
                        : "Desativar Acesso"}
                    </Button>
                  )}
                  {u.id === userProfile.id && (
                    <span className="text-sm text-slate-500 font-medium px-4">
                      Você
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-slate-200">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="text-rose-400 border-rose-500/20 hover:bg-rose-500/10"
        >
          Sair do Sistema
        </Button>
      </div>
    </div>
  );
}
