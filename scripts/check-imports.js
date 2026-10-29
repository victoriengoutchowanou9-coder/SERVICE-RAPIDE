const fs = require('fs');
const path = require('path');

let errors = 0;

function checkFileRequires(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const requireRegex = /require\(['"](\.[^'"]+)['"]\)/g;
  let match;
  while ((match = requireRegex.exec(content)) !== null) {
    const importPath = match[1];
    const dir = path.dirname(filePath);
    let resolved = path.resolve(dir, importPath);
    let found = false;
    const extensions = ['', '.js', '.json', '/index.js'];
    for (const ext of extensions) {
      const candidate = resolved + ext;
      if (fs.existsSync(candidate)) {
        const parentDir = path.dirname(candidate);
        const baseName = path.basename(candidate);
        const diskFiles = fs.readdirSync(parentDir);
        if (diskFiles.includes(baseName)) {
          found = true;
          break;
        } else {
          console.error('CASE MISMATCH in', filePath, 'require:', importPath, 'matched disk file:', diskFiles.find(f => f.toLowerCase() === baseName.toLowerCase()), 'vs requested:', baseName);
          errors++;
        }
      }
    }
    if (!found) {
      console.error('NOT FOUND in', filePath, 'require:', importPath);
      errors++;
    }
  }
}

function scanDir(dir) {
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const p = path.join(dir, item);
    if (fs.statSync(p).isDirectory()) {
      if (item !== 'node_modules' && item !== 'dist' && item !== '.git') {
        scanDir(p);
      }
    } else if (p.endsWith('.js')) {
      checkFileRequires(p);
    }
  }
}

scanDir('api');
console.log('API requires case-sensitivity check done. Errors count:', errors);
