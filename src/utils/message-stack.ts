import { brBuilder } from "@magicyan/discord";
import { ChatInputCommandInteraction } from "discord.js";

class MessageStack {
  private _messages: string[] = [];
  private messageBody: string = "";
  private methods: ChatInputCommandInteraction<"cached">;

  constructor(methods: ChatInputCommandInteraction<"cached">) {
    this.methods = methods;
  }

  private async _triggerUpdate() {
    this.messageBody = brBuilder(this._messages);
    await this.methods.editReply(this.messageBody);
  }

  async push(message: string) {
    this._messages.push(message);
    await this._triggerUpdate();
  }

  async set(messages: string[]) {
    this._messages = [...messages];
    await this._triggerUpdate();
  }

  async clear() {
    this._messages = [];
    await this._triggerUpdate();
  }

  getMessages(): string[] {
    return [...this._messages];
  }

  getCurrentMessageBody(): string {
    return this.messageBody;
  }
}

export default MessageStack;
