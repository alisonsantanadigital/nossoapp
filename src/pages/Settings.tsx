import React, { useState, useEffect } from 'react';
import { updatePassword, signOut } from 'firebase/auth';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { UserProfile } from '../types';

export function Settings() {
  const { userProfile, user } = useAuth();
  
  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [loadingPwd, setLoadingPwd] = useState(false);

  // Admin state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (userProfile?.appRole === 'admin') {
      fetchUsers();
    }
  }, [userProfile?.appRole]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
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
      setPasswordMsg({ type: 'success', text: 'Senha atualizada com sucesso!' });
      setNewPassword('');
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setPasswordMsg({ type: 'error', text: 'Por segurança, você precisa sair e fazer login novamente para mudar a senha.' });
      } else {
        setPasswordMsg({ type: 'error', text: 'Erro ao atualizar senha.' });
      }
    } finally {
      setLoadingPwd(false);
    }
  };

  const toggleUserStatus = async (uid: string, currentStatus: string | undefined) => {
    try {
      const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
      await updateDoc(doc(db, 'users', uid), { status: newStatus });
      setUsers(users.map(u => u.id === uid ? { ...u, status: newStatus } : u));
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar status do usuário.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Configurações</h1>
        <p className="text-slate-400 mt-1">Gerencie sua conta e preferências.</p>
      </div>

      <div className="bg-[#131B2F] p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#1E293B]">
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
            <p className={`text-sm ${passwordMsg.type === 'success' ? 'text-sky-400' : 'text-rose-400'}`}>
              {passwordMsg.text}
            </p>
          )}
          <Button type="submit" loading={loadingPwd}>Atualizar Senha</Button>
        </form>
      </div>

      {userProfile?.appRole === 'admin' && (
        <div className="bg-[#131B2F] p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#1E293B]">
          <h2 className="text-lg font-semibold text-white mb-4">Administração de Usuários</h2>
          <div className="divide-y divide-slate-800/60">
            {loadingUsers ? <p className="text-sm text-slate-400">Carregando...</p> : users.map(u => (
              <div key={u.id} className="py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{u.displayName} (@{u.username})</p>
                  <p className="text-sm text-slate-400">{u.appRole === 'admin' ? 'Administrador' : 'Usuário padrão'}</p>
                </div>
                {u.id !== userProfile.id && (
                  <Button 
                    variant={u.status === 'inactive' ? 'outline' : 'ghost'}
                    onClick={() => toggleUserStatus(u.id, u.status)}
                    className={u.status === 'inactive' ? 'text-sky-400' : 'text-rose-400 hover:text-rose-500 hover:bg-rose-500/10'}
                  >
                    {u.status === 'inactive' ? 'Ativar Acesso' : 'Desativar Acesso'}
                  </Button>
                )}
                {u.id === userProfile.id && (
                  <span className="text-sm text-slate-400 font-medium px-4">Você</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-[#1E293B]">
        <Button variant="outline" onClick={handleLogout} className="text-rose-400 border-rose-500/20 hover:bg-rose-500/10">
          Sair do Sistema
        </Button>
      </div>
    </div>
  );
}
