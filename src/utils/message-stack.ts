import { brBuilder } from "@magicyan/discord";
import { InteractionMethodsType } from "discord/services/interaction-methods.service.js";

class MessageStack {
  private _messages: string[] = [];
  private messageBody: string = "";
  private methods: InteractionMethodsType;

  constructor(methods: InteractionMethodsType) {
    this.methods = methods;
  }

  private _triggerUpdate(): void {
    this.messageBody = brBuilder(this._messages);
    this.methods.editReply(this.messageBody);
  }

  push(message: string): void {
    this._messages.push(message);
    this._triggerUpdate();
  }

  set(messages: string[]): void {
    this._messages = [...messages];
    this._triggerUpdate();
  }

  clear(): void {
    this._messages = [];
    this._triggerUpdate();
  }

  getMessages(): string[] {
    return [...this._messages];
  }

  getCurrentMessageBody(): string {
    return this.messageBody;
  }
}

export default MessageStack;
