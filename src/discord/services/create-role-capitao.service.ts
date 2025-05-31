import { Colors } from "discord.js";
import { InteractionMethods } from "./interaction-methods.service.js";

export default async function CreateRoleCapitaoIfNotExistsService(
  methods: ReturnType<typeof InteractionMethods>
) {
  return await methods.createRoleIfNotExists({
    name: "Capitão",
    color: Colors.Gold,
    mentionable: true,
    permissions: [],
  });
}
