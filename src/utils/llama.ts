import fs from "fs";
import path from "path";
import type { GgufModel, LlamaProfile } from "../types/index";

export function scanForModels(dirs: string[]): GgufModel[] {
  const models: GgufModel[] = [];

  for (const dir of dirs) {
    const expanded = dir.replace(/^~/, process.env.HOME ?? "");
    if (!fs.existsSync(expanded)) continue;

    try {
      const entries = fs.readdirSync(expanded, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".gguf")) {
          const fullPath = path.join(expanded, entry.name);
          let sizeBytes = 0;
          try {
            sizeBytes = fs.statSync(fullPath).size;
          } catch {}
          models.push({
            name: entry.name,
            path: fullPath,
            dir: expanded,
            sizeBytes,
          });
        }
      }
    } catch {}
  }

  return models.sort((a, b) => a.name.localeCompare(b.name));
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function formatTokens(bytes: number): string {
  if (bytes === 0) return "0";
  const k = 1024;
  const sizes = ["", "K", "M", "B", "T"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.ceil(bytes / Math.pow(k, i)).toFixed(0)}${sizes[i]}`;
}

export function buildLlamaArgs(profile: LlamaProfile): string[] {
  const args: string[] = [];

  // Model
  args.push("--model", profile.modelPath);

  // Context
  if (profile.contextSize > 0) {
    args.push("--ctx-size", String(profile.contextSize));
  }

  // Threads
  if (profile.threads > 0) {
    args.push("--threads", String(profile.threads));
  }
  if (profile.threadsHttp > 0) {
    args.push("--threads-http", String(profile.threadsHttp));
  }

  // GPU layers
  if (profile.gpuLayers > 0) {
    args.push("--n-gpu-layers", String(profile.gpuLayers));
  }
  if (profile.mainGpu > 0) {
    args.push("--main-gpu", String(profile.mainGpu));
  }
  if (profile.tensorSplit) {
    args.push("--tensor-split", profile.tensorSplit);
  }

  // KV cache quantization
  if (profile.kvCacheTypeK && profile.kvCacheTypeK !== "f16") {
    args.push("--cache-type-k", profile.kvCacheTypeK);
  }
  if (profile.kvCacheTypeV && profile.kvCacheTypeV !== "f16") {
    args.push("--cache-type-v", profile.kvCacheTypeV);
  }

  // Attention
  if (profile.flashAttention) {
    args.push("--flash-attn", "on");
  }
  if (profile.noMmap) {
    args.push("--no-mmap");
  }
  if (profile.mlock) {
    args.push("--mlock");
  }

  // Sampling
  if (profile.temperature !== 0.8) {
    args.push("--temp", String(profile.temperature));
  }
  if (profile.topK !== 40) {
    args.push("--top-k", String(profile.topK));
  }
  if (profile.topP !== 0.95) {
    args.push("--top-p", String(profile.topP));
  }
  if (profile.minP !== 0.05) {
    args.push("--min-p", String(profile.minP));
  }
  if (profile.repetitionPenalty !== 1.1) {
    args.push("--repeat-penalty", String(profile.repetitionPenalty));
  }
  if (profile.frequencyPenalty !== 0.0) {
    args.push("--frequency-penalty", String(profile.frequencyPenalty));
  }
  if (profile.presencePenalty !== 0.0) {
    args.push("--presence-penalty", String(profile.presencePenalty));
  }

  // MTP / Draft
  if (profile.draftMax > 0) {
    args.push("--draft-max", String(profile.draftMax));
    args.push("--draft-min", String(profile.draftMin));
    if (profile.draftPMin > 0) {
      args.push("--draft-p-min", String(profile.draftPMin));
    }
  }

  // Server
  args.push("--host", profile.host);
  args.push("--port", String(profile.port));
  if (profile.apiKey) {
    args.push("--api-key", profile.apiKey);
  }

  // LoRA
  if (profile.loraPath) {
    args.push("--lora", profile.loraPath);
    if (profile.loraScale !== 1.0) {
      args.push("--lora-scale", String(profile.loraScale));
    }
  }

  // Chat template
  if (profile.chatTemplate) {
    args.push("--chat-template", profile.chatTemplate);
  }

  // System prompt
  if (profile.systemPrompt) {
    args.push("--system-prompt", profile.systemPrompt);
  }

  // Custom flags
  if (profile.customFlags) {
    const custom = profile.customFlags
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    args.push(...custom);
  }

  return args;
}
