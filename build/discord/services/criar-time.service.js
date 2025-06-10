import { prisma } from "../../database/index.js";
import CreateChannelCategoryIfNotExistsService from "./create-categoria.service.js";
import CreateMemberService from "./create-member.service.js";
import CreateTeamService from "./create-team.service.js";
import CreateVoiceChannelService from "./create-voice-channel.service.js";
import { logger } from "../../settings/index.js";
export default async function CriarTimeService(methods) {
    const { getString, getMember, findVoiceChannel, findRoleByName, messageStack, } = methods;
    logger.log(`Começando interação para criar time.`);
    const cargoCapitao = findRoleByName("Capitão");
    if (!cargoCapitao) {
        const errMessage = "Cargo de Capitão não encontrado, criando novo cargo.";
        logger.log(errMessage);
        throw new Error(errMessage);
    }
    const teamName = getString("nome-do-time", required);
    const capitao = getMember("capitao");
    const modalidade = getString("modalidade");
    const teamColor = getString("cor");
    if (!teamName) {
        logger.error("Nome do time não informado.");
        throw new Error("Nome do time não informado.");
    }
    const invalidMentionRegex = /<(@(&|!)?|#)\d{17,19}>/;
    if (invalidMentionRegex.test(teamName)) {
        logger.error("O usuário inseriu uma menção em um campo inválido, suspendendo operação.");
        throw new Error("O nome do time não pode ser uma menção do Discord.");
    }
    if (!capitao) {
        logger.error("Nenhum capitão foi selecionado.");
        throw new Error("Nenhum capitão foi selecionado.");
    }
    if (!modalidade) {
        logger.error("Modalidade não informada.");
        throw new Error("Modalidade não informada.");
    }
    if (!teamColor) {
        logger.error("Cor do time não informada.");
        throw new Error("Cor do time não informada.");
    }
    /* Criação das entidades básicas */
    const playerEntity = await CreateMemberService({ methods, player: capitao });
    const { teamRole, teamEntity } = await CreateTeamService({
        methods,
        teamName,
        teamColor,
    });
    logger.info(`Criando ou atualizando o jogador: ${playerEntity.name} (${playerEntity.guildMemberId})`);
    try {
        const modalityEntity = await prisma.modality.findUnique({
            where: { name: modalidade },
        });
        logger.warn(modalidade, modalityEntity);
        if (!modalityEntity) {
            throw new Error(`Modalidade "${modalidade}" não encontrada.`);
        }
        // Regra: só pode estar em um time por modalidade
        const participacaoMesmaModalidade = await prisma.teamParticipation.findFirst({
            where: {
                playerId: playerEntity.id,
                team: {
                    modalityId: modalityEntity.id,
                },
            },
            include: { team: true },
        });
        if (participacaoMesmaModalidade) {
            throw new Error(`O jogador já está no time "${participacaoMesmaModalidade.team.name}" da modalidade "${modalityEntity.name}".\nNão é permitido um jogador estar em mais de um time da mesma modalidade.`);
        }
        await prisma.$transaction([
            prisma.teamParticipation.create({
                data: {
                    playerId: playerEntity.id,
                    teamId: teamEntity.id,
                },
            }),
            prisma.team.update({
                where: { id: teamEntity.id },
                data: { captainId: playerEntity.id, modalityId: modalityEntity.id },
            }),
            prisma.modality.update({
                where: { id: modalityEntity.id },
                data: {
                    teams: {
                        connect: { id: teamEntity.id },
                    },
                },
            }),
        ]);
        await capitao.roles.add(teamRole);
        await capitao.roles.add(cargoCapitao);
        const message = `Capitão ${capitao.displayName} adicionado ao cargo "${teamRole.name}" e ao cargo de Capitão.`;
        await messageStack.push(message);
        logger.log(message);
    }
    catch (error) {
        const message = `Erro ao adicionar ${capitao.displayName} ao cargo ${teamRole.name}.`;
        logger.error(message, error);
        throw new Error(message);
    }
    const categoria = await CreateChannelCategoryIfNotExistsService({
        methods,
        categoryName: `Times de ${modalidade}`,
    });
    try {
        await CreateVoiceChannelService({
            methods,
            channelName: teamName,
            role: teamRole,
            channelCategory: categoria,
        });
        messageStack.push(`O canal de voz para ${teamRole.name} foi criado com sucesso!`);
    }
    catch (err) {
        if (teamRole && findVoiceChannel(teamRole.name)) {
            await teamRole.delete("Falha ao criar canal de voz associado.");
        }
        logger.error(`Erro ao criar o canal de voz para o time ${teamRole.name}: ${err}`);
        throw new Error(`Houve um erro ao criar o canal de voz para o time ${teamRole.name}, contate um administrador.`);
    }
    await messageStack.push("Time criado com sucesso! 🎉");
}
