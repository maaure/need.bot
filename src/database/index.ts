import { QuickDB } from "quick.db";
import { GuildData } from "./interfaces/GuildData.js";
import { MemberData } from "./interfaces/MemberData.js";
import { TeamData } from "./interfaces/TeamData.js";
import { ModalityData } from "./interfaces/ModalityData.js";

const filePath = rootTo("localdb.sqlite");

const db = {
  guilds: new QuickDB<GuildData>({ filePath, table: "guilds" }),
  members: new QuickDB<MemberData>({ filePath, table: "members" }),
  teams: new QuickDB<TeamData>({ filePath, table: "teams" }),
  modalities: new QuickDB<ModalityData>({ filePath, table: "modalities" }),
};

export { db };
