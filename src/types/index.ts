export type ThemeName =
  | "default"
  | "catppuccin"
  | "gruvbox"
  | "tokyonight"
  | "synthwave84"
  | "solarized"
  | "matrix"
  | "tron-legacy"
  | "tron-ares"
  | "orng"
  | "fnaf";

export interface Theme {
  name: ThemeName;
  label: string;
  bg: string;
  fg: string;
  border: string;
  accent: string;
  accentAlt: string;
  dim: string;
  highlight: string;
  highlightFg: string;
  success: string;
  warning: string;
  error: string;
  cursor: string;
}

export interface GgufModel {
  name: string;
  path: string;
  dir: string;
  sizeBytes: number;
}

export interface ProfileParam {
  key: string;
  value: string | number | boolean;
}

export interface LlamaProfile {
  id: string;
  name: string;
  modelPath: string;
  // Core
  contextSize: number;
  contextUnit: string;
  threads: number;
  threadsHttp: number;
  // GPU
  gpuLayers: number;
  mainGpu: number;
  tensorSplit: string;
  // Quantization
  kvCacheTypeK: string; // f32, f16, bf16, q8_0, q4_0, q4_1, iq4_nl, q5_0, q5_1
  kvCacheTypeV: string;
  cacheTypeDraft: string;
  // Attention
  flashAttention: boolean;
  noMmap: boolean;
  mlock: boolean;
  // Sampling defaults
  temperature: number;
  topK: number;
  topP: number;
  minP: number;
  repetitionPenalty: number;
  frequencyPenalty: number;
  presencePenalty: number;
  // Multi-token prediction (MTP)
  draftMin: number;
  draftMax: number;
  draftPMin: number;
  // Server
  host: string;
  port: number;
  apiKey: string;
  // LoRA
  loraPath: string;
  loraScale: number;
  // System
  systemPrompt: string;
  chatTemplate: string;
  // Custom flags
  customFlags: string;
}

export type AppScreen =
  | "profiles"
  | "profile-edit"
  | "profile-run"
  | "theme-picker"
  | "dir-manager"
  | "model-sync";

export interface AppState {
  screen: AppScreen;
  theme: ThemeName;
  scanDirs: string[];
  models: GgufModel[];
  profiles: LlamaProfile[];
  selectedProfileIdx: number;
  searchQuery: string;
  searching: boolean;
}
