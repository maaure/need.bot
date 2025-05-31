import { MemberData } from "./MemberData.js";
import { ModalityData } from "./ModalityData.js";

export interface TeamData {
  name: string;
  modality: ModalityData[];
  members: MemberData[];
}
