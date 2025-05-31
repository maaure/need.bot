import { Colors } from "discord.js";
import { InteractionMethods } from "./interaction-methods.service.js";

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
    console.error("Erro: Já existe um cargo com o nome desse time.");
    throw new Error("Erro: Já existe um cargo com o nome desse time.");
  }

  const cargoTime = await methods.createRole({
    name: teamName,
    color: teamColor,
    permissions: [],
    mentionable: true,
  });

  return cargoTime;
}
