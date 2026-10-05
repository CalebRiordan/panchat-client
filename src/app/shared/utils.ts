import { heicTo } from 'heic-to';
import * as pdfjsLib from 'pdfjs-dist';
import { WEB_SAFE_IMAGE_TYPES, WORD_MIME } from './constants.js';
import { renderAsync } from 'docx-preview';
import html2canvas from 'html2canvas';

// Point to the worker on a CDN so your main bundle stays small
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

export async function getUrlFromWord(file: File): Promise<string> {
  const container = document.createElement('div');
  // Hide it from the user's view
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  try {
    const arrayBuffer = await file.arrayBuffer();

    // Render the document
    await renderAsync(arrayBuffer, container, undefined, {
      breakPages: true, // Ensures page breaks are respected
    });

    // Find the first "page" - docx-preview wraps pages in section tags
    const firstPage = container.querySelector('section');

    if (!firstPage) {
      throw new Error('Could not find content in Word document.');
    }

    firstPage.style.height = "1000px";

    // Capture only the first page element
    const canvas = await html2canvas(firstPage as HTMLElement, {
      logging: false,
      scale: 0.5,
      useCORS: true,
      y: 0,
    });

    const result = canvas.toDataURL('image/png', 0.7);
    return result;
  } catch (error) {
    console.error('Word preview error:', error);
    return '';
  } finally {
    // Always clean up
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
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

export function isPdf(type: string, filename: string) {
  return type === 'application/pdf' || extensionIs('pdf', filename);
}

export function isWord(type: string, filename: string) {
  return (
    type === 'application/msword' ||
    type === WORD_MIME ||
    extensionIs('docx', filename) ||
    extensionIs('doc', filename)
  );
}

function extensionIs(extension: string, filename: string) {
  return filename.toLowerCase().endsWith(`.${extension}`);
}

  export function urlFor(type: string, defaultUrl = '') {
    if (!WEB_SAFE_IMAGE_TYPES.includes(type)) {
      switch (type) {
        case WORD_MIME:
          return '/assets/icons/word-icon.png';

        case 'application/pdf':
          return '/assets/icons/pdf-icon.png';

        default:
          // this.toast.show(`Unsupported attachment type '${type}'`, 'error');
          return '';
      }
    }

    return defaultUrl;
  }
