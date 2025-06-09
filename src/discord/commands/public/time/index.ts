import { createCommand } from "#base";
import { InteractionMethods } from "#services/interaction-methods.service.js";
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
} from "discord.js";
import { logger } from "#settings";
import getModalidadesChoices from "#utils/modalidades.service.js";
import AutocompleteMemberTeam from "#services/autocomplete-team-sair.service.js";
import AutocompleteColor from "#services/autocomplete-cor.service.js";
import CriarTimeService from "../../../services/criar-time.service.js";
import AdicionarJogadorService from "../../../services/adicionar-jogador.service.js";
import RemoverJogadorTimeService from "#services/remover-jogador-time.service.js";
import DefinirCapitaoService from "../../../services/definir-capitao.service.js";
import ApagarTimeService from "#services/apagar-time.service.js";
import AlterarCorTimeService from "#services/alterar-cor-time.service.js";
import ListarJogadoresService from "#services/listar-jogadores.service.js";

createCommand({
  name: "time",
  description:
    "Gerencie times: crie, adicione, remova jogadores e defina capitão.",
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: "novo",
      description:
        "Cadastre um novo time, criando cargo e canal de voz privado para ele.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "modalidade",
          description: "Escolha a modalidade esportiva do time.",
          type: ApplicationCommandOptionType.String,
          choices: getModalidadesChoices(),
          required,
        },
        {
          name: "nome-do-time",
          description: "Informe o nome do time a ser criado.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: "capitao",
          description:
            "Mencione o capitão do time. Se não, você será o capitão.",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: "cor",
          description: "Selecione a cor do cargo do time.",
          type: ApplicationCommandOptionType.String,
          autocomplete,
          required,
        },
      ],
    },
    {
      name: "adicionar-jogador",
      description: "Adicione um jogador a um time existente.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "time",
          description: "Selecione o time para adicionar o jogador.",
          type: ApplicationCommandOptionType.String,
          required,
          autocomplete,
        },
        {
          name: "jogador",
          description: "Escolha o jogador para adicionar ao time.",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
      ],
    },
    {
      name: "expulsar-jogador",
      description: "Remova um jogador de um time.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "time",
          description: "Selecione o time do qual o jogador será removido.",
          type: ApplicationCommandOptionType.String,
          autocomplete,
          required,
        },
        {
          name: "jogador",
          description: "Escolha o jogador a ser removido do time.",
          type: ApplicationCommandOptionType.User,
          required,
        },
      ],
    },
    {
      name: "definir-capitao",
      description: "Defina um novo capitão para o time.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "time",
          description: "Selecione o time para definir o capitão.",
          type: ApplicationCommandOptionType.String,
          autocomplete,
          required,
        },
        {
          name: "jogador",
          description: "Escolha o novo capitão do time.",
          type: ApplicationCommandOptionType.User,
          required,
        },
      ],
    },
    {
      name: "sair",
      description:
        "Saia do time. Se for capitão, transfere cargo; se último, exclui o time.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "time",
          description: "Selecione o time do qual deseja sair.",
          type: ApplicationCommandOptionType.String,
          required,
          autocomplete,
        },
      ],
    },
    /* {
      name: "excluir",
      description: "Exclua um time do servidor.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "time",
          description: "Selecione o time a ser excluído.",
          type: ApplicationCommandOptionType.String,
          required,
          autocomplete,
        },
      ],
    }, */
    {
      name: "mudar-cor",
      description: "Mude a cor do seu time",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "time",
          description: "Selecione o time a ser ter a cor alterada.",
          type: ApplicationCommandOptionType.String,
          required,
          autocomplete,
        },
        {
          name: "cor",
          description: "Selecione a cor do cargo do time.",
          type: ApplicationCommandOptionType.String,
          autocomplete,
          required,
        },
      ],
    },
    {
      name: "listar-jogadores",
      description: "Liste os jogadores cadastrados em um time",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "time",
          description: "Selecione o time a ser ter a cor alterada.",
          type: ApplicationCommandOptionType.String,
          required,
          autocomplete,
        },
      ],
    },
  ],
  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);

    switch (focusedOption.name) {
      case "time":
        const listAll = interaction.options.getSubcommand() === "excluir";
        return await AutocompleteMemberTeam({ interaction, listAll });
      case "cor":
        return await AutocompleteColor({ interaction });
      default:
        return [];
    }
  },
  async run(interaction) {
    const subCommand = interaction.options.getSubcommand();
    const methods = InteractionMethods(interaction);
    await methods.deferReply();

    switch (subCommand) {
      case "novo":
        await CriarTimeService(methods);
        return;

      case "adicionar-jogador":
        await AdicionarJogadorService(methods);
        return;

      case "expulsar-jogador":
        await RemoverJogadorTimeService(methods);
        return;

      // case "excluir":
      //   await ApagarTimeService(methods);
      //   return;

      case "definir-capitao":
        await DefinirCapitaoService(methods);
        return;

      case "sair":
        await RemoverJogadorTimeService(methods);
        return;

      case "mudar-cor":
        await AlterarCorTimeService(methods);
        return;

      case "listar-jogadores":
        await ListarJogadoresService(methods);
        return;

      default:
        methods.editReply("Comando não encontrado.");
        return;
    }
  },
});
