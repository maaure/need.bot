import { createCommand } from "../../../base/index.js";
import { ApplicationCommandOptionType, ApplicationCommandType, } from "discord.js";
import { InteractionMethods } from "../../../../discord/services/interaction-methods.service.js";
import RemoverJogadorTimeService from "../../../services/remover-jogador-time.service.js";
import AutocompleteMemberTeam from "../../../../discord/services/autocomplete-team-sair.service.js";
createCommand({
    name: "sair-time",
    description: "Sai de um time que você está atualmente.",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "time",
            description: "O nome do time que você deseja sair.",
            type: ApplicationCommandOptionType.String,
            required,
            autocomplete,
        },
    ],
    async autocomplete(interaction) {
        return await AutocompleteMemberTeam({ interaction });
    },
    async run(interaction) {
        const methods = InteractionMethods(interaction);
        await RemoverJogadorTimeService({ methods, player: methods.member });
    },
});
