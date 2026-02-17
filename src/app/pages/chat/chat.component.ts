import {
  Component,
  computed,
  effect,
  ElementRef,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { Message } from '../../models/message';
import { MessageService } from '../../services/message.service';
import { ToastService } from '../../services/toast.service';
import { finalize, toArray } from 'rxjs';
import { generateGuid } from '../../shared/utils';
import heic2any from 'heic2any';

interface FilePreview {
  id: number;
  filename: string;
  url: string;
  file: File;
  loaded: Boolean;
}

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
    const input = event.target as HTMLInputElement;
    const previews = Array.from(input.files ?? [], (file) => {
      return {
        id: Date.now() + Math.random(),
        filename: file.name,
        file: file,
        url: '',
        loaded: false,
      };
    });


    this.files.set(previews);

    // Convert Files to FilePreviews
    const previewsWithUrls = await Promise.all(
      previews.map(async (preview) => {
        if (
          preview.file.type === 'image/heic' ||
          preview.file.name.toLowerCase().endsWith('.heic')
        ) {
          // Update file.url
          preview.url = await this.heicToFilePreview(preview.file);
          return preview;
        } else {
          // NOT ASYNC - room for optimization?
          preview.url = URL.createObjectURL(preview.file);
          return preview;
        }
      }),
    );

    this.files.set(previewsWithUrls);

    console.log(`${this.files().length} files selected`);

    if (this.files() && this.files().length > 0) {
      // Max files error
      if (this.files().length > 15) {
        // alert maximum 15 images
        return;
      }

      // Max upload size error
      const uploadSize = this.files().reduce(
        (acc: number, preview: FilePreview) => acc + preview.file.size,
        0,
      );
      if (uploadSize > 20 * 1024 * 1024) {
        // alert maximum 20MB file upload
        return;
      }
    }
  }

  onImageLoad(id: number) {
    this.files.update((currentFiles) =>
      currentFiles.map((file) => (file.id === id ? { ...file, loaded: true } : file)),
    );
  }

  private async heicToFilePreview(file: File): Promise<string> {
    // Convert any HEIC images to JPG
    const blobArray = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.6,
    });

    const jpgBlob = Array.isArray(blobArray) ? blobArray[0] : blobArray;
    return URL.createObjectURL(jpgBlob);
  }
}
