/**
 * Utilitaire de compression d'images côté client.
 * Réduit la taille des photos avant encodage base64 pour stockage en base de données.
 */

/**
 * Compresse une image (File) en la redimensionnant et en réduisant la qualité JPEG.
 * @param file - Fichier image original
 * @param maxWidth - Largeur maximale en pixels (défaut: 600)
 * @param maxHeight - Hauteur maximale en pixels (défaut: 600)
 * @param quality - Qualité JPEG de 0 à 1 (défaut: 0.7)
 * @returns Promise<string> - Image compressée en base64 data URL
 */
export function compressImage(
  file: File,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Calculer les dimensions proportionnelles
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Dessiner sur un canvas redimensionné
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas non supporté'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en JPEG compressé (beaucoup plus petit que PNG)
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Impossible de charger l\'image'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compresse plusieurs fichiers images en parallèle.
 */
export async function compressImages(
  files: File[],
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.65
): Promise<string[]> {
  const results = await Promise.all(
    files.map((file) => compressImage(file, maxWidth, maxHeight, quality))
  );
  return results;
}
