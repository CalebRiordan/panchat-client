import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { env } from '../environments/environment';
import { MessageService } from './services/message.service';
import { MockMessageService } from './services/message.service.mock';

const useMockData = !env.production;

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideZonelessChangeDetection(),
    { provide: MessageService, useClass: useMockData ? MockMessageService : MessageService },
  ],
};
