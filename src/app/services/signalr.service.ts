import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { env } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection?: signalR.HubConnection;
  private baseApiUrl = env.baseApiUrl;

  public startConnection() {
    if (!this.hubConnection) {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${this.baseApiUrl}/hub`)
        .build();
    }

    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connection started'))
      .catch((err) => console.error('Error establishing SignalR connection: ' + err));
  }
}
