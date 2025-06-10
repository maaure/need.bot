import { Colors } from "discord.js";
import { logger } from "../../settings/index.js";
export default async function CreateRoleCapitaoIfNotExistsService({ methods, }) {
    logger.log("Procurando pela role de Capitão");
    let role = methods.findRoleByName("Capitão");
    if (role) {
        logger.log("Role de capitão já existe. Dando prosseguimento à rotina.");
        return role;
    }
    try {
        logger.log("Tentando criar a role de Capitão!");
        role = await methods.createRoleIfNotExists({
            name: "Capitão",
            color: Colors.Gold,
            mentionable: true,
            permissions: [],
        });
        logger.log("Role de Capitão criada com sucesso!");
    }
    catch (err) {
        logger.error("Aconteceu um erro ao criar a role de Capitão", err);
        throw new Error("Houve um erro ao tentar criar o cargo de Capitão");
    }
    return role;
}
