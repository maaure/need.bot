import { createCommand } from "../../../base/index.js";
import { ApplicationCommandOptionType, ApplicationCommandType, } from "discord.js";
import ApagarTimeService from "./apagar-time.service.js";
import { InteractionMethods } from "../../../services/interaction-methods.service.js";
createCommand({
    name: "apagar-time",
    description: "Remove um time do servidor",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "time",
            description: "command option",
            type: ApplicationCommandOptionType.Role,
            required,
        },
    ],
    async run(interaction) {
        const methods = InteractionMethods(interaction);
        await ApagarTimeService(methods);
    },
});
