import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { Building2 } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { v4 as uuidv4 } from 'uuid';

export function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const [orgName, setOrgName] = useState('Nossa Casa');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const orgId = uuidv4();
      
      // Create the organization
      await setDoc(doc(db, 'organizations', orgId), {
        name: orgName,
        createdAt: new Date(),
        currency: 'BRL',
        members: {
          [user.uid]: 'admin'
        }
      });

      // Update the user profile (use setDoc with merge in case profile was not created properly)
      await setDoc(doc(db, 'users', user.uid), {
        currentOrganizationId: orgId,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Usuário'
      }, { merge: true });

      await refreshProfile();
      navigate('/');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'organizations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center">
        <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-8 h-8 text-teal-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">👋 Vamos configurar sua casa</h1>
        <p className="text-slate-500 mb-8 text-sm">Crie seu ambiente compartilhado para gerenciar as finanças.</p>

        <form onSubmit={handleCreateOrg} className="space-y-6 text-left">
          <Input 
            label="Qual o nome da sua organização/casa?" 
            type="text" 
            placeholder="Ex: Família Silva, Nossa Casa..."
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
          />

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Começar a Usar
          </Button>
        </form>
      </div>
    </div>
  );
}
