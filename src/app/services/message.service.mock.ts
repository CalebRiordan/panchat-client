import { Observable, of } from "rxjs";
import { Message } from "../models/message";
import { MessageService } from "./message.service";

export class MockMessageService extends MessageService {
    override getLatestMessages(fromDate?: Date, fromMessageWithId?: string, limit?: number): Observable<Message[]> {
        return of([]);
    }

    override onIncomingMessage(callback: Function): void {}
}