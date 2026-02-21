import { Component, effect, ElementRef, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Message } from '../../models/message';
import { MessageService } from '../../services/message.service';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs';
import { generateGuid, getUrlFromHeic, getUrlFromPdf } from '../../shared/utils';

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
  imports: [],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit, OnDestroy {
  messages = signal<Message[]>([]);
  sendingMessage = signal(false);
  files = signal<FilePreview[]>([]);
  uploadSize = 0;
  deviceId!: string;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;
  @ViewChild('filesContainer') private filesContainer!: ElementRef;

  constructor(
    private messageService: MessageService,
    private toastService: ToastService,
  ) {
    // Get device ID
    var tempDeviceId = localStorage.getItem('chat_device_id');
    if (!tempDeviceId) {
      tempDeviceId = crypto.randomUUID ? crypto.randomUUID() : generateGuid();
      localStorage.setItem('chat_device_id', tempDeviceId);
    }
    this.deviceId = tempDeviceId;

    messageService.init(this.deviceId);

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
    const content = this.messageInput.nativeElement.value;
    event?.preventDefault();

    if (content) {
      this.sendingMessage.set(true);
      this.messageService
        .sendTextMessage(content)
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
    console.log('onFilesSelected');
    const input = event.target as HTMLInputElement;

    // Create preview objects with empty URL
    const previews = Array.from(input.files ?? []).map((file) => ({
      id: Date.now() + Math.random(),
      filename: file.name,
      file: file,
      url: '',
      loaded: false,
    }));

    console.log(previews);

    // ========================================
    // =========== Validate files =============
    // ========================================
    if (previews && previews.length > 0) {
      // Max files error
      if (this.files().length + previews.length > 15) {
        // alert maximum 15 images

        console.error('Exceeds max files');
        return;
      }

      // Max upload size error (20MB)
      const additionalUploadsSize = this.files().reduce(
        (acc: number, preview: FilePreview) => acc + preview.file.size,
        0,
      );
      if (this.uploadSize + additionalUploadsSize > 20 * 1024 * 1024) {
        // alert maximum 20MB file upload

        console.error('Exceeds max upload size');
        return;
      }

      console.log('Checking for unsupported types');
      // Unsupported file type error
      let invalidIds = [];
      previews.filter((preview) => {
        const type = preview.file.type;
        const isWordDoc =
          type === 'application/msword' ||
          type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          preview.file.name.toLowerCase().endsWith('.docx') ||
          preview.file.name.toLowerCase().endsWith('.doc');

        if (allowedTypes.includes(type) || isWordDoc) {
          return true;
        }

        console.log(`File with name ${preview.filename} is unsupported`);
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

    console.log('Passed validation');

    const preexisting = this.files();
    this.files.set([...preexisting, ...previews]);

    console.log('Updated files signal');

    // ========================================
    // ====== Convert files to previews =======
    // ========================================
    const previewsWithUrls = await Promise.all(
      previews.map(async (p) => {
        if (p.file.type === 'image/heic' || p.filename.toLowerCase().endsWith('.heic')) {
          p.url = await getUrlFromHeic(p.file);
        } else if (p.file.type === 'application/pdf' || p.filename.toLowerCase().endsWith('.pdf')) {
          p.url = await getUrlFromPdf(p.file);
        } else {
          // NOT ASYNC - room for optimization?
          p.url = URL.createObjectURL(p.file);
        }

        return p;
      }),
    );

    console.log('Added URLs');

    // Replace existing file previews with new ones with URLs
    this.files.set([...preexisting, ...previewsWithUrls]);
    console.log(`${this.files().length} files selected`);
  }

  onImageLoad(id: number) {
    this.files.update((currentFiles) =>
      currentFiles.map((file) => (file.id === id ? { ...file, loaded: true } : file)),
    );
  }
}
