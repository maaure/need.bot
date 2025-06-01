import { Colors } from "discord.js";
import { InteractionMethods } from "./interaction-methods.service.js";

interface CreateRoleCapitaoIfNotExistsServiceParams {
  methods: ReturnType<typeof InteractionMethods>;
}

export default async function CreateRoleCapitaoIfNotExistsService({
  methods,
}: CreateRoleCapitaoIfNotExistsServiceParams) {
  return await methods.createRoleIfNotExists({
    name: "Capitão",
    color: Colors.Gold,
    mentionable: true,
    permissions: [],
  });
}
