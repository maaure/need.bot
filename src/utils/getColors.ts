import { Colors } from "discord.js";

const commandColorChoices = Object.keys(Colors).map((key) => ({
  name: key,
  value: key,
}));

export default function getColors(q: string | null) {
  return q
    ? commandColorChoices.filter((color) => color.name.toLowerCase().includes(q.toLowerCase()))
    : commandColorChoices.slice(0, 24);
}
