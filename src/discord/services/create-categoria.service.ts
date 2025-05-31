import { InteractionMethods } from "./interaction-methods.service.js";

interface CreateChannelCategoryIfNotExistsServiceParams {
  methods: ReturnType<typeof InteractionMethods>;
  categoryName: string;
}

export default async function CreateChannelCategoryIfNotExistsService({
  methods,
  categoryName,
}: CreateChannelCategoryIfNotExistsServiceParams) {
  let category = methods.findChannelCategory(categoryName);
  if (category) return category;

  return await methods.createInvisibleChannelCategory(categoryName);
}
