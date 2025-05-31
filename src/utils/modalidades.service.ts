import { Colors } from "discord.js";

export const modalidades = {
  Valorant: {
    cor: Colors.Red,
  },
  "League of Legends": {
    cor: Colors.Green,
  },
};

export default function getModalidadesChoices() {
  return Object.keys(modalidades).map((key) => ({ value: key, name: key }));
}
