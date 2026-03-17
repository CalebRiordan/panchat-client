import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { env } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private hubConnection?: signalR.HubConnection;
  private baseApiUrl = env.baseApiUrl;

  public buildConnection(): SignalRService {
    if (!this.hubConnection) {
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${this.baseApiUrl}/hub`, {
          accessTokenFactory: () => localStorage.getItem('jwt_token')!,
        })
        .build();
    }

    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.stop();
    }

    return this;
  }

  public registerListener(signal: string, callback: Function): SignalRService {
    this.hubConnection?.on(signal, (data) => callback(data));
    return this;
  }

  public start() {
    if (!this.hubConnection) {
      throw new Error('Cannot start hub connection - no existing connection to start');
    }

    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connection started'))
      .catch((err) => console.error('Error establishing SignalR connection: ' + err));
  }
}
