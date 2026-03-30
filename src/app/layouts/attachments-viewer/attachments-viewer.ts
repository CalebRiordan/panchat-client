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
import { AttachmentUI } from '../../models/attachment';

interface TargetImageFinalState {
  width: number;
  height: number;
  top: number;
  left: number;
}

@Component({
  selector: 'app-attachments-viewer',
  imports: [],
  templateUrl: './attachments-viewer.html',
  styleUrl: './attachments-viewer.css',
})
export class AttachmentsViewer {
  visible = signal(false);
  attachmentUIs: AttachmentUI[] = [];

  @ViewChildren('image') images!: QueryList<ElementRef>;
  @ViewChild('viewer') viewer!: ElementRef;

  constructor(public avs: AttachmentsViewerService) {
    // Make viewer visible 0.3 seconds after initiation
    effect(async () => {
      this.attachmentUIs = avs.attachmentUIs();

      if (this.attachmentUIs.length > 0) {
        await this.renderImages(); // Ensure layout is calculated

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
  }

  private async renderImages() {
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
}
