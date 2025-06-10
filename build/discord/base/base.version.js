import ck from "chalk";
const isBun = typeof Bun !== "undefined";
export const BASE_VERSION = "1.2.7"; // DO NOT CHANGE THIS VAR
export const RUNTIME_VERSION = isBun ? Bun.version : process.versions.node;
const engineName = isBun
    ? `${ck.hex("#F9F1E1")("◌ Bun")}`
    : `${ck.hex("#54A044")("◌ Node.js")}`;
export const runtimeDisplay = `${engineName} ${ck.reset.dim(RUNTIME_VERSION)}`;
