const fs = require('fs');
const path = './src/components/Layout.tsx';
let content = fs.readFileSync(path, 'utf8');

// add useAuth to imports if not there
if (!content.includes('useAuth')) {
  content = content.replace(
    'import { cn } from "../lib/utils";',
    'import { cn } from "../lib/utils";\nimport { useAuth } from "../contexts/AuthContext";'
  );
}

// add useAuth hook inside Layout
if (!content.includes('const { userProfile } = useAuth();')) {
  content = content.replace(
    '  const location = useLocation();',
    '  const location = useLocation();\n  const { userProfile } = useAuth();'
  );
}

// replace Settings icon in Desktop nav with Avatar
const desktopSettingsIconOld = `<Settings className="w-5 h-5 text-slate-400" />`;
const desktopSettingsIconNew = `{userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Perfil" className="w-6 h-6 rounded-full object-cover border border-white/10" />
            ) : (
              <Settings className="w-5 h-5 text-slate-400" />
            )}`;
content = content.replace(desktopSettingsIconOld, desktopSettingsIconNew);

// replace Settings icon in Mobile nav with Avatar
const mobileSettingsIconOld = `<Settings className="w-5 h-5" />`;
const mobileSettingsIconNew = `{userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Perfil" className="w-5 h-5 rounded-full object-cover border border-white/10" />
            ) : (
              <Settings className="w-5 h-5" />
            )}`;
content = content.replace(mobileSettingsIconOld, mobileSettingsIconNew);

fs.writeFileSync(path, content);
