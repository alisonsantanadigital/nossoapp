const fs = require('fs');
const path = './src/pages/Dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'import { User as UserIcon, useAuth } from "../contexts/AuthContext";',
  'import { useAuth } from "../contexts/AuthContext";'
);

if (!content.includes('UserIcon')) {
  content = content.replace(
    'Receipt,\n} from "lucide-react";',
    'Receipt,\n  User as UserIcon,\n} from "lucide-react";'
  );
}

fs.writeFileSync(path, content);
