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

@Component({
  selector: 'app-attachments-viewer',
  imports: [],
  templateUrl: './attachments-viewer.html',
  styleUrl: './attachments-viewer.css',
})
export class AttachmentsViewer {
  visible = signal(false);
  attachmentUIs: AttachmentUI[] = [];
  stuntDouble: any;

  @ViewChildren('image') images!: QueryList<ElementRef>;
  @ViewChild('viewer') viewer!: ElementRef;

  constructor(public avs: AttachmentsViewerService) {
    // Make viewer visible 0.3 seconds after initiation
    effect(async () => {
      this.attachmentUIs = avs.attachmentUIs();
      console.log(`Attachments count: ${this.attachmentUIs.length}`);

      if (this.attachmentUIs.length > 0) {
        await this.renderImages();

        this.scrollToAttachment(avs.targetIndex);

        if (avs.targetRect) {
          this.createStuntDouble(avs.targetRect);
          this.transitionStuntDouble();
        }

        // Set visibility timeout
        setTimeout(() => {
          this.visible.set(true);
        }, 300);
      } else {
        console.log(`reset avs.visible`);
        this.visible.set(false);
        // delete stunt double
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

  private createStuntDouble(targetRect: DOMRect) {
    this.stuntDouble = {
      url: this.avs.attachmentUIs()[this.avs.targetIndex].attachment.url,
      top: targetRect.top,
      bottom: targetRect.bottom,
      left: targetRect.left,
      right: targetRect.right,
      style: {
        transform: `translate(${window.innerWidth / 2 - targetRect.left}px, ${window.innerHeight / 2 - targetRect.top}px) scale(2)`,
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      },
    };
  }

  private transitionStuntDouble() {}

  private scrollToAttachment(index: number) {
    const images = this.images.toArray();

    if (images && images[index]) {
      const imageEl = images[index].nativeElement as HTMLElement;
      const viewerEl = this.viewer.nativeElement as HTMLElement;
      const imageTop = imageEl.offsetTop;

      viewerEl.scrollTo({
        top: imageTop - 20,
        left: 0,
        behavior: 'instant',
      });
    }
  }
}
