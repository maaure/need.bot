import { brBuilder } from "@magicyan/discord";
class MessageStack {
    _messages = [];
    messageBody = "";
    methods;
    constructor(methods) {
        this.methods = methods;
    }
    async _triggerUpdate() {
        this.messageBody = brBuilder(this._messages);
        await this.methods.editReply(this.messageBody);
    }
    async push(message) {
        this._messages.push(message);
        await this._triggerUpdate();
    }
    async set(messages) {
        this._messages = [...messages];
        await this._triggerUpdate();
    }
    async clear() {
        this._messages = [];
        await this._triggerUpdate();
    }
    getMessages() {
        return [...this._messages];
    }
    getCurrentMessageBody() {
        return this.messageBody;
    }
}
export default MessageStack;
