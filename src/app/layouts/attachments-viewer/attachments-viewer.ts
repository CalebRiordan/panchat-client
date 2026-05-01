import {
  Component,
  effect,
  ElementRef,
  QueryList,
  signal,
  untracked,
  viewChild,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AttachmentsViewerService } from '../../services/attachments-viewer.service';
import { AttachmentUI } from '../../models/attachment';
import { urlFor } from '../../shared/utils.js';
import { renderAsync } from 'docx-preview';
import { WORD_MIME } from '../../shared/constants.js';

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

  @ViewChildren('image') images!: QueryList<ElementRef>;
  @ViewChild('viewer') viewer!: ElementRef;
  @ViewChild('docContainer') docContainer!: ElementRef;
  // @ViewChild('wordContainer') wordContainer!: ElementRef;

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

        this.toggleViewerVisibility();
      }
    });

    effect(async () => {
      this.document = this.avs.document();
      this.toggleViewerVisibility();

      if (this.document) {
        this.renderDocument(this.document);
      }
    });

    effect(() => {
      const docContent = this.documentContent();

      if (!docContent) return;

      const el = this.docContainer.nativeElement as HTMLElement;
      el.innerHTML = '';
      el.appendChild(docContent.content);
    });
  }

  private toggleViewerVisibility() {
    if (this.avs.document() || this.avs.imageUIs()) {
      setTimeout(() => {
        this.visible.set(true);
      }, 100);
    } else {
      this.visible.set(false);
    }
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
      const container = await this.avs.renderPdfPages(url);

      this.documentContent.set({
        type: 'pdf',
        content: container,
      });
    } else if (type === WORD_MIME) {
      try {
        // Create a temporary container for rendering
        const { arrayBuffer, container } = await this.avs.renderWord(url);
        await renderAsync(arrayBuffer, container);

        this.documentContent.set({
          type: 'word',
          content: container,
        });
      } catch (error) {
        console.error('Error rendering Word document:', error);
      }
    }
  }
}
