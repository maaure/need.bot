import { logger } from "../../settings/index.js";
export default async function CreateChannelCategoryIfNotExistsService({ methods, categoryName, }) {
    const existingCategory = methods.findChannelCategory(categoryName);
    if (existingCategory) {
        logger.log(`Category '${categoryName}' already exists. Skipping creation.`);
        return existingCategory;
    }
    logger.log(`Creating category '${categoryName}'...`);
    const category = await methods.createInvisibleChannelCategory(categoryName);
    logger.success(`Category '${categoryName}' created successfully.`);
    return await category;
}
