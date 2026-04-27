import {
  Component,
  effect,
  ElementRef,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import * as pdfjsLib from 'pdfjs-dist';
import { AttachmentsViewerService } from '../../services/attachments-viewer.service';
import { AttachmentUI } from '../../models/attachment';
import { urlFor } from '../../shared/utils.js';
import { renderAsync } from 'docx-preview';
import { WORD_MIME } from '../../shared/constants.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

@Component({
  selector: 'app-attachments-viewer',
  imports: [],
  templateUrl: './attachments-viewer.html',
  styleUrl: './attachments-viewer.css',
})
export class AttachmentsViewer {
  visible = signal(false);
  imageUIs: AttachmentUI[] = [];
  document: AttachmentUI | undefined = undefined;
  documentContent = signal<{ type: 'pdf' | 'word'; content: HTMLElement } | null>(null);
  private documentCache = new Map<string, ArrayBuffer>();

  @ViewChildren('image') images!: QueryList<ElementRef>;
  @ViewChild('viewer') viewer!: ElementRef;
  @ViewChild('pdfContainer') pdfContainer!: ElementRef;
  @ViewChild('wordContainer') wordContainer!: ElementRef;

  urlFor = (att: AttachmentUI) => urlFor(att.attachment.type, att.attachment.url);

  constructor(
    public avs: AttachmentsViewerService,
    private sanitizer: DomSanitizer,
  ) {
    // Make viewer visible 0.3 seconds after initiation
    effect(async () => {
      this.imageUIs = avs.imageUIs();

      if (this.imageUIs.length > 0) {
        await this.waitForImagesRender(); // Ensure layout is calculated

        if (avs.targetRect) {
          this.scrollToAttachment(avs.targetIndex);
          this.transitionImage(avs.targetRect, avs.targetIndex);
        }

        // Set visibility timeout
        setTimeout(() => {
          this.visible.set(true);
        }, 100);
      } else {
        this.visible.set(false);
      }
    });

    effect(async () => {
      this.document = this.avs.document();

      if (this.document) {
        this.renderDocument(this.document);
      } else {
        this.documentContent.set(null);
      }
    });

    // Handle document DOM injection (Word and PDF)
    effect(() => {
      const docContent = this.documentContent();
      if (docContent && this.pdfContainer) {
        const container = this.pdfContainer.nativeElement as HTMLElement;
        container.innerHTML = '';
        container.appendChild(docContent.content);
      } else if (docContent?.type === 'word' && this.wordContainer) {
        const container = this.wordContainer.nativeElement as HTMLElement;
        container.innerHTML = '';
        container.appendChild(docContent.content);
      }
    });
  }

  private async waitForImagesRender() {
    setTimeout(async () => {
      const imageElements = this.images
        .toArray()
        .map((ref) => ref.nativeElement as HTMLImageElement);

      const loadPromises = imageElements.map((img) => {
        if (img.complete) return Promise.resolve(); // Already cached/loaded
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // Continue even if one fails
        });
      });

      await Promise.all(loadPromises);
    }, 0);
  }

  /**
   * Applies styles to the target image in the attachments viewer to create an animation that gives the appearance that
   * the clicked image in the chat transitions in position and scale to the same image as displayed in the attachments
   * viewer
   *
   * @param {DOMRect} targetRectOrigin The size and position in the viewport of the original image clicked in the chat
   * @param {number} index The index of the image in the list of images to be displayed in the attachments viewer
   */
  private transitionImage(targetRectOrigin: DOMRect, index: number) {
    const finalEl = this.images.toArray()[index].nativeElement as HTMLElement;
    const finalElRect = finalEl.getBoundingClientRect();

    const deltaX = targetRectOrigin.left - finalElRect.left;
    const deltaY = targetRectOrigin.top - finalElRect.top;
    const scaleW = targetRectOrigin.width / finalElRect.width;
    const scaleH = targetRectOrigin.height / finalElRect.height;

    finalEl.style.transition = 'none';
    finalEl.style.transformOrigin = 'top left';
    finalEl.style.opacity = '1';
    finalEl.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleW}, ${scaleH})`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        finalEl.style.transition = 'transform 400ms cubic-bezier(0.2, 0.9, 0.3, 1)';
        finalEl.style.transform = 'none';
      });
    });
  }

  private scrollToAttachment(index: number) {
    const images = this.images.toArray();

    if (images && images[index]) {
      const imageEl = images[index].nativeElement as HTMLElement;
      const viewerEl = this.viewer.nativeElement as HTMLElement;
      const imageTop = imageEl.offsetTop;

      viewerEl.scrollTo({
        top: imageTop - 55,
        left: 0,
        behavior: 'instant',
      });
    }
  }

  private async renderDocument(doc: AttachmentUI) {
    const { url, type } = doc.attachment;

    if (type === 'application/pdf') {
      // Render all PDF pages to canvas elements—no toolbar, just content
      const container = await this.renderPdfPages(url);
      this.documentContent.set({
        type: 'pdf',
        content: container,
      });
    } else if (type === WORD_MIME) {
      try {
        const arrayBuffer = await this.getDocumentArrayBuffer(url);
        // Create a temporary container for rendering
        const tempContainer = document.createElement('div');
        await renderAsync(arrayBuffer, tempContainer);

        this.documentContent.set({
          type: 'word',
          content: tempContainer,
        });
      } catch (error) {
        console.error('Error rendering Word document:', error);
      }
    }
  }

  private async getDocumentArrayBuffer(dataUrl: string): Promise<ArrayBuffer> {
    const cacheKey = dataUrl;

    // Check cache first
    if (this.documentCache.has(cacheKey)) {
      return this.documentCache.get(cacheKey)!;
    }

    // Convert data URL to ArrayBuffer
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    // Store in cache for subsequent previews
    this.documentCache.set(cacheKey, arrayBuffer);

    return arrayBuffer;
  }

  private async renderPdfPages(dataUrl: string): Promise<HTMLElement> {
    const container = document.createElement('div');
    container.className = 'pdf-pages-container';

    const arrayBuffer = await this.getDocumentArrayBuffer(dataUrl);
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    // Render all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

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
}
