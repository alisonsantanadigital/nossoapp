import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Home, Mail, Lock, User as UserIcon } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile
      await setDoc(doc(db, 'users', user.uid), {
        displayName: name,
        email: email,
        preferences: {}
      });

      // User needs an organization, send to onboarding
      navigate('/onboarding');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado. Por favor, faça login.');
      } else {
        setError(err.message || 'Erro ao criar conta.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-600/20">
            <Home className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">Criar Conta</h1>
        <p className="text-center text-slate-500 mb-8 text-sm">Comece a organizar as finanças da sua casa.</p>

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
            label="E-mail" 
            type="email" 
            placeholder="joao@exemplo.com"
            icon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button type="submit" className="w-full mt-4" size="lg" loading={loading}>
            Criar Conta
          </Button>
        </form>
        
        <p className="text-center text-slate-500 text-sm mt-8">
          Já possui conta? <Link to="/login" className="font-medium text-teal-600 hover:text-teal-700">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
