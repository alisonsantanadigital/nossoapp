import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw, Plus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/Button';

interface ExtractedTransaction {
  description: string;
  amount: number;
  type: 'expense' | 'income';
  date: string;
}

export function ImportData() {
  const { userProfile } = useAuth();
  const { accounts, categories } = useOrg();
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedTransaction[] | null>(null);
  
  // Selected account and category to bulk import
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione apenas arquivos de imagem (PNG, JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImagePreview(event.target.result as string);
        setError('');
        setSuccess('');
        setExtractedData(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
    if (!imagePreview) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Split "data:image/jpeg;base64,....."
      const [header, base64Data] = imagePreview.split(',');
      const mimeTypeMatch = header.match(/:(.*?);/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

      const res = await fetch('/api/gemini/extract-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erro na API de IA');
      }

      setExtractedData(data.transactions);
      setSuccess('Dados extraídos com sucesso! Revise e importe abaixo.');
    } catch (err: any) {
      setError(err.message || 'Falha ao analisar a imagem.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!extractedData || extractedData.length === 0) return;
    if (!userProfile?.currentOrganizationId) {
      setError('Organização não encontrada.');
      return;
    }
    if (!selectedAccountId) {
      setError('Selecione uma conta para importar os lançamentos.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const orgId = userProfile.currentOrganizationId;
      const txRef = collection(db, 'transactions');
      
      const promises = extractedData.map(tx => {
        let dateObj = new Date(tx.date);
        if (isNaN(dateObj.getTime())) dateObj = new Date(); // fallback
        
        return addDoc(txRef, {
          orgId,
          amount: tx.amount,
          type: tx.type,
          description: tx.description,
          date: dateObj.toISOString(),
          accountId: selectedAccountId,
          categoryId: selectedCategoryId || null, // Optional
          status: 'completed',
          createdAt: serverTimestamp(),
          notes: 'Importado via IA',
        });
      });

      await Promise.all(promises);
      
      setSuccess(`${extractedData.length} lançamento(s) importados com sucesso!`);
      setExtractedData(null);
      setImagePreview(null);
    } catch (err: any) {
      setError('Erro ao salvar lançamentos no banco de dados.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (index: number) => {
    if (extractedData) {
      setExtractedData(extractedData.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Leitura de Notas</h1>
        <p className="text-slate-400 mt-1">Envie o print de um extrato ou cupom e nossa IA fará o trabalho de digitar tudo por você.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Upload Column */}
        <div className="space-y-4">
          <div 
            className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer min-h-[300px]
              ${imagePreview ? 'border-teal-500 bg-sky-400/10/30' : 'border-slate-700 bg-[#131B2F] hover:bg-[#1E293B]'}`}
            onClick={() => !imagePreview && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/png, image/jpeg, image/webp" 
              onChange={handleFileSelect}
            />
            
            {imagePreview ? (
              <div className="relative w-full">
                <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-[400px] object-contain rounded-xl" />
                <button 
                  className="absolute top-2 right-2 bg-[#131B2F] text-slate-700 p-2 rounded-full shadow-lg hover:bg-red-50 hover:text-rose-400 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImagePreview(null);
                    setExtractedData(null);
                    setSuccess('');
                  }}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-[#1E293B] rounded-full flex items-center justify-center mb-4 text-sky-400">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-white mb-1">Clique para enviar imagem</h3>
                <p className="text-sm text-slate-400">PNG ou JPG com recibos ou extratos</p>
              </>
            )}
          </div>

          {imagePreview && !extractedData && (
            <Button 
              onClick={handleExtract} 
              loading={loading}
              className="w-full h-12 text-base"
            >
              <FileText className="w-5 h-5 mr-2" />
              Analisar e Extrair Dados (IA)
            </Button>
          )}

          {error && (
            <div className="p-4 bg-rose-500/10 text-rose-400 rounded-xl flex items-start gap-3 border border-rose-500/20">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-sky-500/10 text-sky-400 rounded-xl flex items-start gap-3 border border-sky-500/20">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}
        </div>

        {/* Results Column */}
        {extractedData && (
          <div className="bg-[#131B2F] p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#1E293B] flex flex-col h-full max-h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-white text-lg">Dados Extraídos</h3>
              <span className="text-sm font-medium bg-[#1E293B] text-slate-300 py-1 px-3 rounded-full">
                {extractedData.length} itens
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Destino: Conta</label>
                <select 
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-[#1E293B] focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-[#131B2F] text-white"
                >
                  <option value="" disabled>Selecione a conta</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Destino: Categoria Padrão (Opcional)</label>
                <select 
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-[#1E293B] focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-[#131B2F] text-white"
                >
                  <option value="">Nenhuma</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[200px] border-t border-[#1E293B] pt-4 -mx-2 px-2">
              <div className="space-y-3">
                {extractedData.map((tx, idx) => (
                  <div key={idx} className="group flex items-center justify-between p-3 rounded-xl border border-[#1E293B] bg-[#1E293B] hover:border-teal-200 transition-colors">
                    <div>
                      <p className="font-medium text-white text-sm">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tx.type === 'expense' ? 'bg-rose-400/10 text-rose-400' : 'bg-emerald-400/10 text-emerald-400'}`}>
                          {tx.type === 'expense' ? 'Saída' : 'Entrada'}
                        </span>
                        <span className="text-xs text-slate-400">{tx.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-semibold ${tx.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {tx.type === 'expense' ? '-' : '+'}R$ {tx.amount.toFixed(2)}
                      </span>
                      <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {extractedData.length === 0 && (
                  <p className="text-center text-slate-400 py-8">Nenhum dado válido extraído.</p>
                )}
              </div>
            </div>

            <div className="pt-6 mt-auto border-t border-[#1E293B]">
              <Button 
                onClick={handleImport} 
                loading={loading}
                disabled={extractedData.length === 0}
                className="w-full"
              >
                <Plus className="w-5 h-5 mr-2" />
                Salvar Lançamentos no Banco
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
