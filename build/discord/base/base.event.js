import { baseStorage } from "./base.storage.js";
import ck from "chalk";
export function baseRegisterEvents(client) {
    const eventHandlers = baseStorage.events.map((collection, event) => ({
        event, handlers: collection.map(e => ({ run: e.run, once: e.once, tags: e.tags }))
    }));
    const { middleware, onError } = baseStorage.config.events;
    for (const { event, handlers } of eventHandlers) {
        const onHandlers = handlers.filter(e => !e.once);
        const onceHandlers = handlers.filter(e => e.once);
        const processHandlers = (eventHandlers) => {
            return async (...args) => {
                const eventData = { name: event, args };
                for (const { run, tags: eventTags } of eventHandlers) {
                    (async function () {
                        let block = false;
                        const blockFunction = (...tags) => {
                            if (tags && eventTags && tags.some(tag => eventTags.includes(tag))) {
                                block = true;
                            }
                            if (!tags || tags.length < 1)
                                block = true;
                        };
                        if (middleware)
                            await middleware(eventData, blockFunction);
                        if (block)
                            return;
                        const execution = run(...args);
                        if (onError) {
                            await execution.catch(error => onError(error, eventData));
                        }
                        else {
                            await execution;
                        }
                    })();
                }
            };
        };
        client.on(event, processHandlers(onHandlers));
        client.once(event, processHandlers(onceHandlers));
    }
}
export function baseEventLog(data) {
    const u = ck.underline;
    baseStorage.loadLogs.events
        .push(`${ck.yellow(`☉ ${data.name}`)} ${ck.gray(">")} ${u.yellowBright(data.event)} ${ck.green(`event ✓`)}`);
}
;
