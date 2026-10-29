const fs = require('fs');
const path = require('path');

const targetPattern = /let pg;\s*try\s*\{\s*pg = require\('pg'\);\s*\}\s*catch\s*\(e\)\s*\{\s*try\s*\{\s*pg = require\('\.\.\/\.\.\/backend\/node_modules\/pg'\);\s*\}\s*catch\s*\(e2\)\s*\{\s*pg = require\('\.\.\/backend\/node_modules\/pg'\);\s*\}\s*\}\s*const \{ Client \} = pg;/g;

const replacement = "const { Client } = require('pg');";

function fixFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      fixFiles(full);
    } else if (f.endsWith('.js')) {
      let content = fs.readFileSync(full, 'utf8');
      if (targetPattern.test(content)) {
        content = content.replace(targetPattern, replacement);
        fs.writeFileSync(full, content, 'utf8');
        console.log('Fixed pg require in:', full);
      }
    }
  }
}

fixFiles('api');
console.log('PG require cleanup finished.');
