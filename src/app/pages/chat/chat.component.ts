import { Component, effect, ElementRef, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Message } from '../../models/message';
import { MessageService } from '../../services/message.service';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs';
import { getUrlFromHeic, getUrlFromPdf } from '../../shared/utils';
import { isHeic } from 'heic-to';
import { MessageBox } from '../../layouts/message-box/message-box';
import { AuthService } from '../../services/auth';
import { AttachmentsViewer } from '../../layouts/attachments-viewer/attachments-viewer';
import { DataService } from '../../services/data.service.js';

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
  imports: [MessageBox, AttachmentsViewer],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit, OnDestroy {
  messages = signal<Message[]>([]);
  initialFetch = signal(true);
  initialError = signal(false);
  sendingMessage = signal(false);
  files = signal<FilePreview[]>([]);
  filesReady = signal(false);
  uploadSize = 0;
  scrollNewMessageIntoView = false;

  @ViewChild('chatContainer') private chatContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  constructor(
    private messageService: MessageService,
    private toastService: ToastService,
    private authService: AuthService,
    private dataService: DataService,
  ) {
    effect(() => {
      const currentMessages = this.messages();

      if (currentMessages.length > 0) {
        this.scrollToBottom();
      }
    });

    effect(() => {
      const trigger = this.dataService.copyCommand();
      if (trigger === 0) return;

      const lastMessage = this.messages().at(-1);

      if (lastMessage?.attachments.length ?? 0 > 0) {
        //TODO: Copy blob to clipboard, ensuring copy happens only once image is loaded
        // navigator.clipboard.write()
        console.log('Copy image');
      } else {
        navigator.clipboard.writeText(lastMessage?.text ?? '');
        console.log('Copy text');
      }
    });

    effect(async () => {
      const trigger = this.dataService.pasteCommand();
      if (trigger === 0) return;

      this.messageInput.nativeElement.value = await navigator.clipboard.readText();
    })
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
          this.toastService.show(
            'An error occurred trying to fetch message for this account',
            'error',
          );
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

  onLogout() {
    this.authService.logout();
  }
}
