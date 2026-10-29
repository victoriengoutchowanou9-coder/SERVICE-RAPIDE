const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Début du build Service Rapide pour Vercel...');

const frontendDir = path.join(__dirname, '..', 'frontend');

console.log('📦 Installation des dépendances du frontend...');
execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });

console.log('🔨 Compilation du frontend (tsc && vite build)...');
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

const srcDist = path.join(frontendDir, 'dist');
const rootDist = path.join(__dirname, '..', 'dist');

if (fs.existsSync(srcDist)) {
  console.log('📂 Copie de dist vers la racine du projet...');
  if (fs.existsSync(rootDist)) {
    fs.rmSync(rootDist, { recursive: true, force: true });
  }
  fs.cpSync(srcDist, rootDist, { recursive: true });
  console.log('✅ frontend/dist copié vers dist à la racine.');
} else {
  console.error('❌ Erreur: frontend/dist n\'a pas été généré.');
  process.exit(1);
}

console.log('🎉 Build Service Rapide terminé avec succès !');
