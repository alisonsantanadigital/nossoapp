const fs = require('fs');

let path = './src/pages/ImportData.tsx';
let content = fs.readFileSync(path, 'utf8');

const newReturn = `  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      <div className="text-center space-y-2 mt-4">
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
          IA Leitor
        </h1>
        <p className="text-slate-400 max-w-md mx-auto">
          Faça upload de um comprovante ou tire uma foto para extrair os dados automaticamente usando inteligência artificial.
        </p>
      </div>

      <div className="bg-[#151E2E] rounded-[2.5rem] p-4 sm:p-6 shadow-2xl shadow-black/20 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div
            className={\`relative rounded-[2rem] overflow-hidden flex flex-col items-center justify-center transition-all duration-500
              \${imagePreview ? "bg-black/40 min-h-[300px]" : "bg-[#090E17] min-h-[350px] border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-white/[0.02]"}\`}
          >
            <input
              type="file"
              ref={cameraInputRef}
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
            />
            <input
              type="file"
              ref={galleryInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
            />

            {imagePreview ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className={\`w-full max-h-[400px] object-contain transition-opacity duration-300 \${loading ? 'opacity-50' : 'opacity-100'}\`}
                />
                
                {loading && (
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-[2rem]">
                    <div className="w-full h-1 bg-indigo-500 shadow-[0_0_15px_#6366f1] animate-[scan_2s_ease-in-out_infinite]" />
                    <div className="absolute inset-0 bg-indigo-500/10 animate-pulse" />
                  </div>
                )}

                {!loading && !extractedData && (
                  <button
                    className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white p-3 rounded-full shadow-lg hover:bg-rose-500/80 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetAll();
                    }}
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping opacity-75" />
                  <FileText className="w-10 h-10 text-indigo-400 relative z-10" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Escanear Comprovante
                </h3>
                <p className="text-slate-400 mb-8 max-w-[250px]">
                  Centralize o documento na imagem para melhores resultados.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                  <Button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 shadow-lg shadow-indigo-500/25 bg-gradient-to-r from-indigo-600 to-blue-600 border-none rounded-full"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Câmera
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex-1 bg-white/5 border-white/10 rounded-full"
                  >
                    <ImageIcon className="w-5 h-5 mr-2 text-slate-300" />
                    Galeria
                  </Button>
                </div>
              </div>
            )}
          </div>

          {imagePreview && !extractedData && !loading && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <Button
                onClick={handleExtract}
                className="w-full h-14 text-lg shadow-lg shadow-indigo-500/25 bg-gradient-to-r from-indigo-600 to-blue-600 border-none rounded-full"
              >
                <FileText className="w-5 h-5 mr-2" />
                Extrair Dados
              </Button>
            </div>
          )}

          {loading && (
             <div className="text-center p-4 animate-pulse">
               <p className="text-indigo-400 font-medium">Analisando documento...</p>
               <p className="text-sm text-slate-400">Nossa IA está lendo as informações.</p>
             </div>
          )}

          {error && (
            <div className="p-4 bg-rose-500/10 text-rose-400 rounded-2xl flex items-start gap-3 border border-rose-500/20">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-start gap-3 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          {extractedData && !loading && (
            <div className="bg-[#090E17] rounded-3xl p-6 border border-white/10 shadow-inner animate-in fade-in slide-in-from-bottom-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Dados Extraídos
                </h3>
                <button
                  onClick={openEdit}
                  className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-full transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={saveEdit} className="space-y-4">
                  <Input
                    label="Descrição"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Valor"
                      type="number"
                      step="0.01"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      required
                    />
                    <Input
                      label="Data"
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      required
                    />
                  </div>
                  <Input
                    label="Nº Comprovante (opcional)"
                    value={editReceiptNumber}
                    onChange={(e) => setEditReceiptNumber(e.target.value)}
                  />
                  <div className="flex gap-3 pt-2">
                    <Button type="submit" className="flex-1 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 border-none">
                      Salvar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 rounded-full"
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Valor</span>
                    <span className={\`text-2xl font-bold \${extractedData.type === 'income' ? 'text-emerald-400' : 'text-white'}\`}>
                      R$ {extractedData.amount.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Descrição</span>
                    <span className="text-white font-medium text-right max-w-[60%] truncate">
                      {extractedData.description}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Data</span>
                    <span className="text-white font-medium">
                      {extractedData.date.split("-").reverse().join("/")}
                    </span>
                  </div>
                  {extractedData.receiptNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Comprovante</span>
                      <span className="text-slate-300 font-medium">
                        #{extractedData.receiptNumber}
                      </span>
                    </div>
                  )}

                  <div className="pt-6 border-t border-white/5 space-y-4">
                     <p className="text-sm font-medium text-slate-300">Aprovar Importação</p>
                    <div className="flex gap-4">
                      <Button
                        onClick={handleConfirmImport}
                        className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-400 text-white border-none rounded-full shadow-lg shadow-emerald-500/20"
                      >
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Confirmar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={resetAll}
                        className="w-14 h-14 p-0 shrink-0 border-white/10 text-slate-400 hover:text-white rounded-full flex items-center justify-center"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;

const returnIndex = content.indexOf('  return (');
if (returnIndex !== -1) {
  content = content.substring(0, returnIndex) + newReturn;
  fs.writeFileSync(path, content);
}
