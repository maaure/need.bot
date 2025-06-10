import { prisma } from "../../database/index.js";
export default async function ListarJogadoresService(methods) {
    const { getString, messageStack } = methods;
    const teamName = getString("time");
    // Validação: nome do time informado
    if (!teamName) {
        throw new Error("Nome do time não informado.");
    }
    // Validação: nome do time não pode ser menção
    const invalidMentionRegex = /<@!?\d+>|<@&\d+>|<#\d+>/;
    if (invalidMentionRegex.test(teamName)) {
        throw new Error("O nome do time não pode ser uma menção do Discord.");
    }
    // Busca o time no banco
    const teamEntity = await prisma.team.findUnique({
        where: { name: teamName },
        include: {
            players: {
                include: { player: true },
            },
            captain: true,
        },
    });
    if (!teamEntity) {
        throw new Error(`O time "${teamName}" não foi encontrado.`);
    }
    // Validação: time tem jogadores
    if (!teamEntity.players || teamEntity.players.length === 0) {
        throw new Error(`O time "${teamName}" não possui jogadores.`);
    }
    // Monta a lista de jogadores
    const jogadores = teamEntity.players.map((p) => {
        const isCaptain = teamEntity.captainId === p.playerId;
        return `${isCaptain ? "👑 " : ""}${p.player.name}`;
    });
    const message = `Jogadores do time **${teamEntity.name}**:\n${jogadores.join("\n")}`;
    await messageStack.push(message);
    return message;
}
