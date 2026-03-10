import { Component, effect, ElementRef, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Message } from '../../models/message';
import { MessageService } from '../../services/message.service';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs';
import { generateGuid, getUrlFromHeic, getUrlFromPdf } from '../../shared/utils';
import { isHeic } from 'heic-to';
import { DataService } from '../../services/data.service';
import { MessageBox } from '../../layouts/message-box/message-box';

interface FilePreview {
  id: number;
  filename: string;
  url: string;
  file: File;
  loaded: Boolean;
}

const allowedTypes = [
  'image/png',
  'image/jpeg',
  'image/heic',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@Component({
  selector: 'app-chat',
  imports: [MessageBox],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit, OnDestroy {
  messages = signal<Message[]>([]);
  firstFetch = signal(true);
  sendingMessage = signal(false);
  files = signal<FilePreview[]>([]);
  uploadSize = 0;
  filesReady = signal(false);

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;
  @ViewChild('filesContainer') private filesContainer!: ElementRef;

  constructor(
    private messageService: MessageService,
    private toastService: ToastService,
  ) {
    effect(() => {
      const currentMessages = this.messages();

      if (currentMessages.length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }

  ngOnInit(): void {
    // Retrieve all messages
    setTimeout(() => {}, 8000);
    if (this.messages.length == 0) {
      this.messageService.getLatestMessages().subscribe({
        next: (messages) => {
          console.log(`Retrieved ${messages.length} messages: ${messages}`);

          this.messages.set(messages);
        },
        error: (err) => {
          console.error('Error occurred while trying to retrieve messages: ' + err.message);
          this.toastService.show(
            'An error occurred trying to fetch message for this account',
            'error',
          );
        },
        complete: () => this.firstFetch.set(false),
      });
    }

    // Listen for new messages
    this.messageService.onIncomingMessage((m: Message) => {
      console.log('Received message from websocket connection');

      this.messages.update((msgs) => [...msgs, m]);
    });
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;

      const distanceFromBottom = el.scrollHeight - el.clientHeight - el.scrollTop;

      if (distanceFromBottom < 100) {
        el.scroll({
          top: el.scrollHeight,
          left: 0,
          behaviour: 'smooth',
        });
      }
    }
  }

  adjustHeight(el: HTMLTextAreaElement) {
    if (el.scrollHeight > 200) {
      el.style.height = 200 + 'px';
      el.style.overflowY = 'scroll';
      el.scrollTop = el.scrollHeight;
    } else {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
      el.style.overflowY = 'hidden';
    }
  }

  onSend(event?: Event) {
    const text = this.messageInput.nativeElement.value;
    event?.preventDefault();

    if (text || this.files().length > 0) {
      const files = this.files().map((fp) => fp.file);
      this.sendingMessage.set(true);

      this.messageService
        .pushMessage(text ?? null, files)
        .pipe(finalize(() => this.sendingMessage.set(false)))
        .subscribe({
          next: () => {
            this.messageInput.nativeElement.style.height = 'auto';
            this.messageInput.nativeElement.style.overflowY = 'hidden';
            this.messageInput.nativeElement.value = '';
          },
          error: (err) => {
            console.error(err);
            this.toastService.show('An error occurred while trying to send your message', 'error');
          },
        });
    }
  }

  async onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    // Create preview objects with empty URL
    const previews = Array.from(input.files ?? []).map((file) => ({
      id: Date.now() + Math.random(),
      filename: file.name,
      file: file,
      url: '',
      loaded: false,
    }));

    // ========================================
    // =========== Validate files =============
    // ========================================
    if (previews && previews.length > 0) {
      // Max files error
      if (this.files().length + previews.length > 15) {
        // alert maximum 15 images

        return;
      }

      // Max upload size error (20MB)
      const additionalUploadsSize = this.files().reduce(
        (acc: number, preview: FilePreview) => acc + preview.file.size,
        0,
      );
      if (this.uploadSize + additionalUploadsSize > 20 * 1024 * 1024) {
        // alert maximum 20MB file upload

        return;
      }

      // Unsupported file type error
      let invalidIds = [];
      previews.filter((preview) => {
        const type = preview.file.type;
        const isWordDoc =
          type === 'application/msword' ||
          type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          this.extensionIs('docx', preview) ||
          this.extensionIs('doc', preview);
        const isHeic = type === 'image/heic' || this.extensionIs('heic', preview);

        if (allowedTypes.includes(type) || isWordDoc || isHeic) {
          return true;
        }

        invalidIds.push(preview.id);
        return false;
      });

      if (invalidIds.length == 1) {
        // alert file ${name} is of unsupported type ${type}
        return;
      } else if (invalidIds.length > 1) {
        // alert ${invalidIds.length} files of unsupported formats
        return;
      }
    }

    this.filesReady.set(false);
    const preexisting = this.files();
    this.files.set([...preexisting, ...previews]);

    // ========================================
    // ====== Convert files to previews =======
    // ========================================
    const previewsWithUrls = await Promise.all(
      previews.map(async (p) => {
        const isPdf = p.file.type === 'application/pdf' || this.extensionIs('pdf', p);

        if (await isHeic(p.file)) {
          p.url = await getUrlFromHeic(p.file);
        } else if (isPdf) {
          p.url = await getUrlFromPdf(p.file);
        } else {
          // NOT ASYNC - room for optimization?
          p.url = URL.createObjectURL(p.file);
        }

        return p;
      }),
    );

    // Replace existing file previews with new ones with URLs
    this.filesReady.set(true);
    this.files.set([...preexisting, ...previewsWithUrls]);
    console.log(`${this.files().length} files selected`);
  }

  onImageLoad(id: number) {
    this.files.update((currentFiles) =>
      currentFiles.map((file) => (file.id === id ? { ...file, loaded: true } : file)),
    );
  }

  onRemoveFile(id: number) {
    this.files.update((current) => current.filter((p) => p.id != id));
  }

  private extensionIs(extension: string, preview: FilePreview) {
    return preview.filename.toLowerCase().endsWith(`.${extension}`);
  }
}
