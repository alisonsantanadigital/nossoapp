const fs = require('fs');
const path = './src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import { User as UserIcon } from "lucide-react"')) {
  content = content.replace(
    'import {',
    'import { User as UserIcon,'
  );
}

const headerOld = `<div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Boa noite, {displayName} 👋
          </h1>
          <p className="text-slate-400 mt-1">
            Aqui está o resumo da {organization?.name || "sua casa"} em{" "}
            <span className="capitalize">{currentMonth}</span>.
          </p>
        </div>`;

const headerNew = `<div className="flex items-center gap-4">
          {userProfile?.photoURL ? (
            <img src={userProfile.photoURL} alt={displayName} className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover border-2 border-white/10" />
          ) : (
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-slate-400" />
            </div>
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Boa noite, {displayName} 👋
            </h1>
            <p className="text-slate-400 mt-1">
              Resumo da {organization?.name || "sua casa"} em{" "}
              <span className="capitalize">{currentMonth}</span>.
            </p>
          </div>
        </div>`;

content = content.replace(headerOld, headerNew);
fs.writeFileSync(path, content);
