import {
  Component,
  effect,
  ElementRef,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { AttachmentsViewerService } from '../../services/attachments-viewer.service';
import { AttachmentInfo, AttachmentUI } from '../../models/attachment';
import { urlFor } from '../../shared/utils.js';
import { renderAsync } from 'docx-preview';
import { WORD_MIME } from '../../shared/constants.js';
import { AttachmentComponent } from '../attachment/attachment';
import { AttachmentActionsService } from '../../services/attachment-actions.service.js';

@Component({
  selector: 'app-attachments-viewer',
  imports: [AttachmentComponent],
  templateUrl: './attachments-viewer.html',
  styleUrl: './attachments-viewer.css',
})
export class AttachmentsViewer {
  visible = signal(false);
  imageUIs: AttachmentUI[] = [];
  document: AttachmentUI | undefined = undefined;
  documentContent = signal<{ type: 'pdf' | 'word'; content: HTMLElement } | null>(null);
  message?: string;
  backstack = signal<{ imageUIs: AttachmentUI[] } | undefined>(undefined);

  @ViewChildren(AttachmentComponent) attachments!: QueryList<AttachmentComponent>;
  @ViewChild('viewer') viewer!: ElementRef;
  @ViewChild('docContainer') docContainer!: ElementRef;

  urlFor = (att: AttachmentUI) => urlFor(att.attachment.type, att.attachment.url);

  get images(): ElementRef<HTMLImageElement>[] {
    return this.attachments.map((att) => att.imgRef);
  }

  constructor(
    public avs: AttachmentsViewerService,
    private attachmentActionsService: AttachmentActionsService,
  ) {
    // Make viewer visible 0.3 seconds after initiation
    effect(async () => {
      this.imageUIs = avs.imageUIs();

      if (avs.loadNewImages) {
        avs.loadNewImages = false;
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

      if (this.document) {
        await this.renderDocument(this.document);
      }
      this.toggleViewerVisibility();
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
    if (this.avs.document() || this.avs.imageUIs().length > 0) {
      setTimeout(() => {
        console.log('visible');
        this.visible.set(true);
      }, 100);
    } else {
      this.visible.set(false);
    }
  }

  private async waitForImagesRender() {
    setTimeout(async () => {
      const imageElements = this.images.map((ref) => ref.nativeElement as HTMLImageElement);

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
    // Make attachment visible throughout transition
    const attachmentComp = this.attachments.toArray()[index];
    const attachmentEl = attachmentComp.host.nativeElement;
    attachmentEl.style.opacity = '1';

    // const finalEl = this.images[index].nativeElement as HTMLElement;
    const ElRect = attachmentEl.getBoundingClientRect();

    const deltaX = targetRectOrigin.left - ElRect.left;
    const deltaY = targetRectOrigin.top - ElRect.top;
    const scaleW = targetRectOrigin.width / ElRect.width;
    const scaleH = targetRectOrigin.height / ElRect.height;

    attachmentEl.style.transition = 'none';
    attachmentEl.style.transformOrigin = 'top left';
    attachmentEl.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleW}, ${scaleH})`;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        attachmentEl.style.transition = 'transform 400ms cubic-bezier(0.2, 0.9, 0.3, 1)';
        attachmentEl.style.transform = 'none';
      });
    });
  }

  private scrollToAttachment(index: number) {
    const atts = this.attachments.toArray();

    if (atts && atts[index]) {
      const attEl = atts[index].host.nativeElement as HTMLElement;
      const viewerEl = this.viewer.nativeElement as HTMLElement;
      const imageTop = attEl.offsetTop;

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

  async onCopy(att: AttachmentInfo) {
    const success = await this.attachmentActionsService.copyAttachment(att, this.message);

    this.avs.imageUIs.update((atts) => {
      return atts.map((a) => (a.attachment.url == att.url ? { ...a, copied: success } : a));
    });

    if (success) {
      console.log('Successfully copied image and text');
    } else {
      // TODO: Show toast error
    }
  }

  async openDoc(att: AttachmentUI) {
    //Set backstack
    this.backstack.set({ imageUIs: this.imageUIs });

    // Clear AVS
    this.avs.clear();

    // Open document for reading
    this.avs.openDoc(att);
  }

  async popBackstack() {
    const backstack = this.backstack();
    if (backstack?.imageUIs) {
      this.avs.clear();
      this.avs.imageUIs.set(backstack.imageUIs);
      this.backstack.set(undefined);
    }
  }
}
