const fs = require('fs');
const path = './src/lib/firebase.ts';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('export { firebaseConfig };')) {
  content = content + '\nexport { firebaseConfig };';
  fs.writeFileSync(path, content);
}
