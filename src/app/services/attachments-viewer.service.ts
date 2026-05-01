import { Injectable, signal, WritableSignal } from '@angular/core';
import { AttachmentUI } from '../models/attachment';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

@Injectable({ providedIn: 'root' })
export class AttachmentsViewerService {
  document = signal<AttachmentUI | undefined>(undefined);
  imageUIs = signal<AttachmentUI[]>([]);
  targetIndex = 0;
  targetRect?: DOMRect = undefined;
  stuntDouble: any;

  private documentCache = new Map<string, ArrayBuffer>();

  setAttachments() {}

  showImages(attachments: AttachmentUI[], targetImageRect: DOMRect, targetImageIndex: number) {
    this.imageUIs.set(attachments);
    this.targetIndex = targetImageIndex;
    this.targetRect = targetImageRect;
  }

  showDoc(document: AttachmentUI) {
    this.document.set(document);
  }

  clear() {
    this.imageUIs.set([]);
    this.document.set(undefined);
  }

  public async renderPdfPages(dataUrl: string): Promise<HTMLElement> {
    const container = document.createElement('div');
    container.className = 'pdf-pages-container';

    const arrayBuffer = await this.getDocumentArrayBuffer(dataUrl);
      console.log(arrayBuffer);

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    // Render all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.6 });

      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-page-canvas';
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const canvasContext = canvas.getContext('2d');
      if (canvasContext) {
        await page.render({
          canvasContext,
          viewport,
          canvas,
        }).promise;
      }

      container.appendChild(canvas);
    }

    pdf.destroy();
    return container;
  }

  async renderWord(dataUrl: string) {
    const arrayBuffer = await this.getDocumentArrayBuffer(dataUrl);
    return { arrayBuffer: arrayBuffer, container: document.createElement('div') };
  }

  private async getDocumentArrayBuffer(dataUrl: string): Promise<ArrayBuffer> {
    const cacheKey = dataUrl;

    // Check cache first
    if (this.documentCache.has(cacheKey)) {
      return this.documentCache.get(cacheKey)!.slice(0);
    }

    // Convert data URL to ArrayBuffer
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    // Store in cache for subsequent previews
    this.documentCache.set(cacheKey, arrayBuffer);

    return arrayBuffer.slice(0);
  }
}
