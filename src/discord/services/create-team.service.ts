import { Colors } from "discord.js";
import { InteractionMethods } from "./interaction-methods.service.js";
import { logger } from "#settings";

interface CreateTeamServiceParam {
  methods: ReturnType<typeof InteractionMethods>;
  teamName: string;
  teamColor: keyof typeof Colors;
}

export default async function CreateTeamService({
  methods,
  teamName,
  teamColor,
}: CreateTeamServiceParam) {
  const role = methods.findRoleByName(teamName);
  if (role) {
    const message = `Erro: Já existe um cargo com o nome "${teamName}".`;
    logger.error(message);
    throw new Error(message);
  }

  const cargoTime = await methods.createRole({
    name: teamName,
    color: teamColor,
    permissions: [],
    mentionable: true,
  });

  return cargoTime;
}
