import { spaceBuilder } from "@magicyan/discord";
import ck from "chalk";
import { findRoute } from "rou3";
import { baseStorage } from "./base.storage.js";
export var ResponderType;
(function (ResponderType) {
    ResponderType["Button"] = "button";
    ResponderType["StringSelect"] = "select.string";
    ResponderType["UserSelect"] = "select.user";
    ResponderType["RoleSelect"] = "select.role";
    ResponderType["ChannelSelect"] = "select.channel";
    ResponderType["MentionableSelect"] = "select.mentionable";
    ResponderType["Modal"] = "modal";
    ResponderType["ModalComponent"] = "modal.component";
})(ResponderType || (ResponderType = {}));
function getResponderType(interaction) {
    return interaction.isButton() ? ResponderType.Button :
        interaction.isStringSelectMenu() ? ResponderType.StringSelect :
            interaction.isChannelSelectMenu() ? ResponderType.ChannelSelect :
                interaction.isRoleSelectMenu() ? ResponderType.RoleSelect :
                    interaction.isUserSelectMenu() ? ResponderType.UserSelect :
                        interaction.isMentionableSelectMenu() ? ResponderType.MentionableSelect :
                            interaction.isModalSubmit() && interaction.isFromMessage() ? ResponderType.ModalComponent :
                                interaction.isModalSubmit() ? ResponderType.Modal : undefined;
}
export async function baseResponderHandler(interaction) {
    const onNotFound = baseStorage.config.responders.onNotFound;
    const responderType = getResponderType(interaction);
    if (!responderType) {
        onNotFound?.(interaction);
        return;
    }
    const handler = findRoute(baseStorage.responders, responderType, interaction.customId);
    if (!handler) {
        onNotFound?.(interaction);
        return;
    }
    if (handler.params && handler.data.parse) {
        handler.params = handler.data.parse(handler.params);
    }
    const params = Object.assign({}, handler.params);
    const middleware = baseStorage.config.responders.middleware;
    const onError = baseStorage.config.responders.onError;
    let block = false;
    if (middleware)
        await middleware(interaction, () => block = true, params);
    if (block)
        return;
    const execution = handler.data.run(interaction, params);
    if (onError) {
        await execution.catch(error => onError(error, interaction, params));
    }
    else {
        await execution;
    }
}
export function baseResponderLog(customId, type) {
    const u = ck.underline;
    baseStorage.loadLogs.responders
        .push(ck.green(spaceBuilder(ck.greenBright(`▸ ${type}`), ck.gray(">"), u.blue(customId), "✓")));
}
