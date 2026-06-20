import Conf from "conf";
import type { GgufModel, LlamaProfile, ThemeName } from "../types/index";
import { nanoid } from "./nanoid";

interface StoreSchema {
  theme: ThemeName;
  scanDirs: string[];
  profiles: LlamaProfile[];
  models: GgufModel[];
}

const conf = new Conf<StoreSchema>({
  projectName: "llamoo",
  defaults: {
    theme: "catppuccin",
    scanDirs: [],
    profiles: [],
    models: [],
  },
});

export function getThemeName(): ThemeName {
  return conf.get("theme");
}

export function setThemeName(t: ThemeName): void {
  conf.set("theme", t);
}

export function getScanDirs(): string[] {
  return conf.get("scanDirs");
}

export function setScanDirs(dirs: string[]): void {
  conf.set("scanDirs", dirs);
}

export function getProfiles(): LlamaProfile[] {
  return conf.get("profiles");
}

export function saveProfile(profile: LlamaProfile): void {
  const profiles = conf.get("profiles");
  const idx = profiles.findIndex((p) => p.id === profile.id);
  if (idx >= 0) {
    profiles[idx] = profile;
  } else {
    profiles.push(profile);
  }
  conf.set("profiles", profiles);
}

export function deleteProfile(id: string): void {
  const profiles = conf.get("profiles").filter((p) => p.id !== id);
  conf.set("profiles", profiles);
}

export function getModels(): GgufModel[] {
  return conf.get("models");
}

export function setModels(models: GgufModel[]): void {
  conf.set("models", models);
}

export function makeDefaultProfile(modelPath: string): LlamaProfile {
  return {
    id: nanoid(),
    name: "",
    modelPath,
    contextSize: 64,
    contextUnit: "K",
    threads: 4,
    threadsHttp: 4,
    gpuLayers: 0,
    mainGpu: 0,
    tensorSplit: "",
    kvCacheTypeK: "q8_0",
    kvCacheTypeV: "q8_0",
    cacheTypeDraft: "f16",
    flashAttention: false,
    noMmap: false,
    mlock: false,
    temperature: 0.8,
    topK: 40,
    topP: 0.95,
    minP: 0.05,
    repetitionPenalty: 1.1,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    draftMin: 0,
    draftMax: 0,
    draftPMin: 0.0,
    host: "127.0.0.1",
    port: 8000,
    apiKey: "",
    loraPath: "",
    loraScale: 1.0,
    systemPrompt: "",
    chatTemplate: "",
    customFlags: "",
  };
}
