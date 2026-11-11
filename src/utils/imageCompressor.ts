/**
 * Mengompresi dan meresize gambar di sisi client sebelum diunggah ke backend/Google Drive
 */
export async function compressImage(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.82
): Promise<{ base64: string; previewUrl: string; sizeKb: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal memproses canvas gambar'));
          return;
        }

        // Draw image on white background (avoid transparent png artifacts)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        const approximateSizeKb = Math.round((compressedBase64.length * 3) / 4 / 1024);

        resolve({
          base64: compressedBase64,
          previewUrl: compressedBase64,
          sizeKb: approximateSizeKb,
          width,
          height,
        });
      };
      img.onerror = () => reject(new Error('Format file gambar tidak valid atau rusak'));
    };
    reader.onerror = () => reject(new Error('Gagal membaca file dari perangkat'));
  });
}
