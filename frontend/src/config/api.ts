// Configuration centralisée de l'API Backend pour le frontend
// En production sur Vercel, définissez la variable d'environnement VITE_API_URL
// Exemple : https://service-rapide-backend.onrender.com

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';
