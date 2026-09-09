import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Edit2,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useOrg } from "../contexts/OrgContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

interface ExtractedTransaction {
  description: string;
  amount: number;
  type: "expense" | "income";
  date: string;
  receiptNumber?: string;
}

export function ImportData() {
  const { userProfile } = useAuth();
  const { organization } = useOrg();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [extractedData, setExtractedData] =
    useState<ExtractedTransaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit Form State
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editReceiptNumber, setEditReceiptNumber] = useState("");

  // Selected account and category to import
  const [selectedAccountId, setSelectedAccountId] = useState("default");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!navigator.onLine) {
      setError("Sem conexão com a internet. Verifique sua rede e tente novamente.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione apenas arquivos de imagem (PNG, JPG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImagePreview(event.target.result as string);
        setError("");
        setSuccess("");
        setExtractedData(null);
        setIsEditing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
    if (!imagePreview) return;

    if (!navigator.onLine) {
      setError("Sem conexão com a internet. A leitura com IA precisa de internet.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [header, base64Data] = imagePreview.split(",");
      const mimeTypeMatch = header.match(/:(.*?);/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg";

      const res = await fetch("/api/gemini/extract-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro na API de IA");
      }

      setExtractedData(data.transaction);
      setSuccess("Leitura concluída! Revise os dados abaixo.");
    } catch (err: any) {
      setError(err.message || "Falha ao analisar a imagem.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!extractedData) return;

    if (!navigator.onLine) {
      setError("Sem conexão com a internet. Verifique sua rede e tente novamente.");
      return;
    }

    if (!userProfile?.currentOrganizationId) {
      setError("Organização não encontrada.");
      return;
    }
    if (!selectedAccountId) {
      setError("Selecione uma conta para importar os lançamentos.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const orgId = userProfile.currentOrganizationId;
      const txRef = collection(db, "transactions");

      let dateObj = new Date(extractedData.date);
      if (isNaN(dateObj.getTime())) dateObj = new Date();

      await addDoc(txRef, {
        orgId,
        amount: extractedData.amount,
        type: extractedData.type,
        description: extractedData.description,
        date: dateObj.toISOString(),
        accountId: selectedAccountId,
        categoryId: selectedCategoryId || null,
        status: "completed",
        createdAt: serverTimestamp(),
        notes: extractedData.receiptNumber
          ? `Nota: ${extractedData.receiptNumber}`
          : "Importado via IA",
        imageUrl: imagePreview,
      });

      setSuccess("Lançamento salvo com sucesso!");
      setExtractedData(null);
      setImagePreview(null);
      setIsEditing(false);
    } catch (err: any) {
      setError("Erro ao salvar lançamento no banco de dados.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = () => {
    if (!extractedData) return;
    setEditDesc(extractedData.description);
    setEditAmount(extractedData.amount.toString());
    setEditDate(extractedData.date);
    setEditReceiptNumber(extractedData.receiptNumber || "");
    setIsEditing(true);
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extractedData) return;

    setExtractedData({
      ...extractedData,
      description: editDesc,
      amount: Number(editAmount),
      date: editDate,
      receiptNumber: editReceiptNumber,
    });
    setIsEditing(false);
  };

  const resetAll = () => {
    setImagePreview(null);
    setExtractedData(null);
    setIsEditing(false);
    setError("");
    setSuccess("");
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Leitura de Comprovante
        </h1>
        <p className="text-slate-500 mt-1">
          Tire uma foto pelo celular ou envie um print e nossa IA extrairá os
          dados automaticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Column */}
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-colors min-h-[300px]
              ${imagePreview ? "border-sky-500 bg-sky-400/10" : "border-slate-300 bg-white"}`}
          >
            {/* Input for direct camera capture */}
            <input
              type="file"
              ref={cameraInputRef}
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
            />
            {/* Input for gallery/file picker */}
            <input
              type="file"
              ref={galleryInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
            />

            {imagePreview ? (
              <div className="relative w-full">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-auto max-h-[400px] object-contain rounded-xl"
                />
                <button
                  className="absolute top-2 right-2 bg-white text-slate-600 p-2 rounded-full shadow-lg hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetAll();
                  }}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-sky-600">
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  Enviar Comprovante
                </h3>
                <p className="text-sm text-slate-500 mb-8">
                  Tire uma foto ou escolha da galeria
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full px-4">
                  <Button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 shadow-lg shadow-sky-500/20"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Tirar Foto
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex-1 bg-slate-100 border-slate-300"
                  >
                    <ImageIcon className="w-5 h-5 mr-2 text-slate-600" />
                    <span className="text-slate-600">Galeria / Print</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {imagePreview && !extractedData && (
            <Button
              onClick={handleExtract}
              loading={loading}
              className="w-full h-12 text-base shadow-lg shadow-sky-500/20"
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
            <div className="p-4 bg-sky-500/10 text-sky-600 rounded-xl flex items-start gap-3 border border-sky-500/20">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}
        </div>

        {/* Results Column */}
        {extractedData && (
          <div className="bg-white p-6 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-200 flex flex-col h-full">
            <h3 className="font-semibold text-slate-900 text-lg mb-6 border-b border-slate-200 pb-4">
              Comprovante Identificado
            </h3>

            {isEditing ? (
              <form onSubmit={saveEdit} className="space-y-4 mb-6 flex-1">
                <Input
                  label="Estabelecimento / Descrição"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  required
                />
                <Input
                  label="Valor Total (R$)"
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  required
                />
                <Input
                  label="Data da Compra"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                />
                <Input
                  label="Número da Nota (Opcional)"
                  value={editReceiptNumber}
                  onChange={(e) => setEditReceiptNumber(e.target.value)}
                />
                <div className="pt-4 flex gap-3">
                  <Button
                    type="submit"
                    className="flex-1 shadow-lg shadow-sky-500/20"
                  >
                    Salvar Alterações
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 flex-1">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-3">
                  <div className="flex justify-between border-b border-slate-200/60 pb-3">
                    <span className="text-slate-500 text-sm">
                      Estabelecimento:
                    </span>
                    <span className="text-slate-900 font-medium text-right">
                      {extractedData.description}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-3 pt-1">
                    <span className="text-slate-500 text-sm">Valor:</span>
                    <span className="text-emerald-400 font-bold text-right">
                      R$ {extractedData.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-3 pt-1">
                    <span className="text-slate-500 text-sm">Data:</span>
                    <span className="text-slate-900 font-medium text-right">
                      {extractedData.date}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500 text-sm">
                      Número da nota:
                    </span>
                    <span className="text-slate-900 font-medium text-right">
                      {extractedData.receiptNumber || "Não identificado"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-600">
                    Escolha a conta para abater o valor:
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 bg-slate-50 text-slate-900"
                  >
                    <option value="default">Conta Padrão</option>
                  </select>
                </div>

                <div className="bg-sky-500/10 p-5 rounded-xl border border-sky-500/20 text-center mt-6">
                  <p className="text-sky-600 font-medium mb-4">
                    Os dados identificados estão corretos?
                  </p>

                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={handleConfirmImport}
                      loading={loading}
                      className="w-full shadow-lg shadow-sky-500/20 h-12"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Confirmar e Abater Valor
                    </Button>
                    <Button
                      variant="outline"
                      onClick={openEdit}
                      className="w-full h-11"
                      disabled={loading}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar Informações
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={resetAll}
                      className="w-full h-11 text-slate-500 hover:text-rose-400"
                      disabled={loading}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tirar Outra Foto
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
