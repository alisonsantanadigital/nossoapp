import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Home, Lock, User as UserIcon } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { usernameToEmail } from './Login';

export function Register() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic username validation (no spaces, only letters/numbers)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('O usuário deve conter apenas letras, números e underlines, sem espaços.');
      return;
    }

    setLoading(true);
    try {
      const email = usernameToEmail(username);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      const isAdmin = username.toLowerCase() === 'alisonsan';
      
      // Create user profile
      await setDoc(doc(db, 'users', user.uid), {
        displayName: name,
        username: username.toLowerCase(),
        email: email,
        preferences: {},
        status: 'active',
        appRole: isAdmin ? 'admin' : 'user'
      });

      // User needs an organization, send to onboarding
      navigate('/onboarding');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este usuário já está cadastrado. Por favor, faça login.');
      } else {
        setError(err.message || 'Erro ao criar conta.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1121] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#131B2F] p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#1E293B]">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Home className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-white mb-2">Criar Conta</h1>
        <p className="text-center text-slate-400 mb-8 text-sm">Comece a organizar as finanças da sua casa.</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <Input 
            label="Seu Nome" 
            type="text" 
            placeholder="João Silva"
            icon={<UserIcon className="w-4 h-4" />}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input 
            label="Nome de Usuário" 
            type="text" 
            placeholder="joaosilva"
            icon={<UserIcon className="w-4 h-4" />}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input 
            label="Senha" 
            type="password" 
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          {error && <p className="text-rose-400 text-sm text-center">{error}</p>}

          <Button type="submit" className="w-full mt-4" size="lg" loading={loading}>
            Criar Conta
          </Button>
        </form>
        
        <p className="text-center text-slate-400 text-sm mt-8">
          Já possui conta? <Link to="/login" className="font-medium text-sky-400 hover:text-sky-300">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
