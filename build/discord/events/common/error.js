import { createEvent } from "../../base/index.js";
import { logger } from "../../../settings/index.js";
createEvent({
    name: "Error handler",
    event: "error",
    async run(error) {
        logger.error(error);
    },
});
