import { heicTo } from 'heic-to';
import * as pdfjsLib from 'pdfjs-dist';

// Point to the worker on a CDN so your main bundle stays small
const pdfjsVersion = pdfjsLib.version;
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export function generateGuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getUrlFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();

  // Load the document and get first page
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

  const pdf = await loadingTask.promise;

  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 0.5 });

  // Create an off-screen canvas to draw the page
  const canvas = document.createElement('canvas');
  const canvasContext = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  if (canvasContext) {
    await page.render({ canvas, canvasContext, viewport }).promise;

    // Turn that canvas into a Base64 image string
    const result = canvas.toDataURL('image/jpeg', 0.8);

    // Clean up to save memory
    pdf.destroy();

    return result;
  }

  return '';
}

export async function convertToPngBlob(url: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Must allow cross-origin for the canvas to not become "tainted"
    img.crossOrigin = 'anonymous'; 
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Failed to get canvas context');
      
      ctx.drawImage(img, 0, 0);
      
      // Export specifically as image/png
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject('Canvas toBlob failed');
      }, 'image/png');
    };

    img.onerror = () => reject('Failed to load image for conversion');
  });
}

export async function getUrlFromHeic(file: File): Promise<string> {
  // Convert any HEIC images to JPG
  const blobArray = await heicTo({
    blob: file,
    type: 'image/jpeg',
    quality: 0.6,
  });

  const jpgBlob = Array.isArray(blobArray) ? blobArray[0] : blobArray;
  return URL.createObjectURL(jpgBlob);
}
