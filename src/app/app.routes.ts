import { Routes } from '@angular/router';
import { SessionComponent } from './pages/session/session-component';
import { authGuard, guestGuard } from './services/auth.guard';
import { ChatComponent } from './pages/chat/chat.component';

export const routes: Routes = [
    {
        path: 'session',
        component: SessionComponent,
        canActivate: [guestGuard]
    },
    {
        path: '/',
        component: ChatComponent,
        canActivate: [authGuard]
    }
];
