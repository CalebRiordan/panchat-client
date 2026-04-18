import {
  Component,
  effect,
  ElementRef,
  OnDestroy,
  OnInit,
  signal,
  untracked,
  ViewChild,
} from '@angular/core';
import { Message } from '../../models/message';
import { MessageService } from '../../services/message.service';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs';
import {
  getUrlFromHeic,
  getUrlFromPdf,
  getUrlFromWord,
  isPdf,
  isWord,
  urlFor,
} from '../../shared/utils';
import { isHeic } from 'heic-to';
import { MessageBox } from '../../layouts/message-box/message-box';
import { AuthService } from '../../services/auth';
import { AttachmentsViewer } from '../../layouts/attachments-viewer/attachments-viewer';
import { ClipboardService } from '../../services/clipboard.service.js';
import { AttachmentActionsService } from '../../services/attachment-actions.service';
import { ALLOWED_TYPES, DOCUMENT_TYPES } from '../../shared/constants.js';
import { AttachmentInfo } from '../../models/attachment.js';

interface FilePreview {
  id: number;
  filename: string;
  url: string;
  file: File;
  loaded: Boolean;
}

@Component({
  selector: 'app-chat',
  imports: [MessageBox, AttachmentsViewer],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit, OnDestroy {
  messages = signal<Message[]>([]);
  files = signal<FilePreview[]>([]);
  uploadSize = 0;

  // Shared imports for use in HTML template
  docTypes = DOCUMENT_TYPES;
  isDocument = (type: string) => this.docTypes.includes(type);
  urlFor = (preview: FilePreview) => urlFor(preview.file.type);

  // UI state variables
  scrollNewMessageIntoView = false;
  filesReady = signal(false);
  initialFetch = signal(true);
  initialError = signal(false);
  sendingMessage = signal(false);

  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  constructor(
    private messageService: MessageService,
    private toast: ToastService,
    private authService: AuthService,
    private clipbardService: ClipboardService,
    private attachmentActionsService: AttachmentActionsService,
  ) {
    // Effect for messages
    effect(() => {
      const currentMessages = this.messages();

      if (currentMessages.length > 0) {
        this.scrollToBottom();
      }
    });

    // Effect for copyCommand
    effect(async () => {
      const trigger = this.clipbardService.copyCommand();
      if (trigger === 0) return;

      untracked(async () => {
        const lastMessage = this.messages().at(-1);
        const att = lastMessage?.attachments[0];

        // Check if last message has file to copy
        if (att) {
          await this.attachmentActionsService.copyAttachment(att, lastMessage.text);
        }
      });
    });

    // Effect for pasteCommand
    effect(async () => {
      const trigger = this.clipbardService.pasteCommand();
      if (trigger === 0) return;

      untracked(async () => {
        const files = this.clipbardService.pastedFiles;
        const text = this.clipbardService.pastedText;

        if (text) {
          setTimeout(() => {
            this.messageInput.nativeElement.value = text;
          });
        }
        if (files) await this.createPreviews(files);
      });
    });
  }

  ngOnDestroy(): void {
    this.messages.set([]);
    this.files.set([]);
  }

  ngOnInit(): void {
    // Retrieve all messages
    if (this.messages.length == 0) {
      this.messageService.getLatestMessages().subscribe({
        next: (messages) => {
          this.messages.set(messages);
          this.scrollToBottom(false);
        },
        error: (err) => {
          console.error('Error occurred while trying to retrieve messages: ' + err.message);
          this.toast.show('An error occurred trying to fetch message for this account', 'error');
          this.initialFetch.set(false);
          this.initialError.set(true);
        },
        complete: () => this.initialFetch.set(false),
      });
    }

    // Listen for new messages
    this.messageService.onIncomingMessage((m: Message) => {
      console.log('Received message from websocket connection');

      this.messages.update((msgs) => [...msgs, m]);
    });
  }

  private scrollToBottom(onlyWhenNearBottom = true) {
    setTimeout(() => {
      if (this.chatContainer) {
        const el = this.chatContainer.nativeElement;

        const distanceFromBottom = el.scrollHeight - el.clientHeight - el.scrollTop;

        // Scroll to bottom of chat
        if (
          this.scrollNewMessageIntoView ||
          !onlyWhenNearBottom ||
          (onlyWhenNearBottom && distanceFromBottom < 150)
        ) {
          this.scrollNewMessageIntoView = false;

          el.scroll({
            top: el.scrollHeight,
            left: 0,
            behavior: onlyWhenNearBottom ? 'smooth' : 'auto',
          });
        }
      }
    }, 400);
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

      // Send message and respond to result
      this.messageService
        .pushMessage(text ?? null, files)
        .pipe(finalize(() => this.sendingMessage.set(false)))
        .subscribe({
          next: () => {
            this.messageInput.nativeElement.style.height = 'auto';
            this.messageInput.nativeElement.style.overflowY = 'hidden';
            this.messageInput.nativeElement.value = '';
            this.files.set([]);
            this.scrollNewMessageIntoView = true;
          },
          error: (err) => {
            console.error(err);
            this.toast.show('An error occurred while trying to send your message', 'error');
          },
        });
    }
  }

  async onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    await this.createPreviews(Array.from(input.files ?? []));
  }

  async createPreviews(files: File[]) {
    // Create preview objects with empty URL
    const previews = files.map((file) => ({
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
      let invalidIds: number[] = [];
      previews.filter(async (preview) => {
        const type = preview.file.type;

        if (
          ALLOWED_TYPES.includes(type) ||
          isWord(type, preview.filename) ||
          (await isHeic(preview.file))
        ) {
          return true;
        }

        invalidIds.push(preview.id);
        return false;
      });

      if (invalidIds.length == 1) {
        const invalidFile = previews.find((p) => p.id === invalidIds[0])!;
        this.toast.show(
          `${invalidFile.filename} is of unsupported type '${invalidFile.file.type}'`,
        );
        return;
      } else if (invalidIds.length > 1) {
        this.toast.show(`${invalidIds.length} files of unsupported formats`);
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
        const f = p.file;
        if (await isHeic(f)) {
          p.url = await getUrlFromHeic(f);
        } else if (isPdf(f.type, p.filename)) {
          p.url = await getUrlFromPdf(f);
        } else if (isWord(f.type, p.filename)) {
          p.url = await getUrlFromWord(f);
        } else {
          // NOT ASYNC - room for optimization?
          p.url = URL.createObjectURL(f);
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

  onRemoveAllPreviews() {
    this.files.set([]);
  }

  onLogout() {
    this.authService.logout();
  }
}
