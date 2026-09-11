const fs = require('fs');
const path = './src/pages/Transactions.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. imports
content = content.replace(
  'import { useLocation } from "react-router-dom";',
  'import { useLocation, useSearchParams } from "react-router-dom";'
);

// 2. Setup hook
content = content.replace(
  'const { organization } = useOrg();',
  'const { organization } = useOrg();\n  const [searchParams, setSearchParams] = useSearchParams();'
);

// 3. Add effect to open new transaction modal
const effectStr = `
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      handleOpenNew();
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);
`;

if (!content.includes('searchParams.get("new")')) {
  content = content.replace(
    '// Modal state',
    effectStr + '\n  // Modal state'
  );
}

fs.writeFileSync(path, content);
