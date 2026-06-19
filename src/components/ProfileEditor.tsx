import React, { useState, useCallback } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import type { Theme, LlamaProfile, GgufModel } from "../types/index";
import { ThemedBox } from "./ThemedBox";
import { HintBar } from "./StatusBar";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";

interface ProfileEditorProps {
  theme: Theme;
  profile: LlamaProfile;
  models: GgufModel[];
  onSave: (profile: LlamaProfile) => void;
  onCancel: () => void;
}

type FieldDef =
  | { type: "text"; key: keyof LlamaProfile; label: string; desc: string }
  | { type: "number"; key: keyof LlamaProfile; label: string; desc: string; step?: number }
  | { type: "bool"; key: keyof LlamaProfile; label: string; desc: string }
  | { type: "select"; key: keyof LlamaProfile; label: string; desc: string; options: string[] }
  | { type: "model"; key: "modelPath"; label: string; desc: string };

const KV_TYPES = ["f32", "f16", "bf16", "q8_0", "q4_0", "q4_1", "iq4_nl", "q5_0", "q5_1"];
const CHAT_TEMPLATES = [
  "", "llama3", "chatml", "mistral", "gemma", "phi3", "command-r",
  "zephyr", "openchat", "alpaca", "vicuna",
];

const FIELDS: FieldDef[] = [
  // General
  { type: "text", key: "name", label: "Profile Name", desc: "Human-readable name for this profile" },
  { type: "model", key: "modelPath", label: "Model", desc: "Select .gguf model to use" },

  // Context & threads
  { type: "number", key: "contextSize", label: "Context Size", desc: "Max context window in tokens (--ctx-size)", step: 512 },
  { type: "number", key: "threads", label: "Threads (CPU)", desc: "Number of CPU threads (--threads)", step: 1 },
  { type: "number", key: "threadsHttp", label: "Threads (HTTP)", desc: "Threads for HTTP handling (--threads-http)", step: 1 },

  // GPU
  { type: "number", key: "gpuLayers", label: "GPU Layers", desc: "Layers to offload to GPU (--n-gpu-layers), 0=CPU only", step: 1 },
  { type: "number", key: "mainGpu", label: "Main GPU", desc: "Primary GPU index for multi-GPU (--main-gpu)", step: 1 },
  { type: "text", key: "tensorSplit", label: "Tensor Split", desc: "GPU split ratios e.g. '3,1' for 75%/25% (--tensor-split)" },

  // KV cache quantization
  { type: "select", key: "kvCacheTypeK", label: "KV Cache Type K", desc: "Key cache quantization type (--cache-type-k)", options: KV_TYPES },
  { type: "select", key: "kvCacheTypeV", label: "KV Cache Type V", desc: "Value cache quantization type (--cache-type-v)", options: KV_TYPES },

  // Flags
  { type: "bool", key: "flashAttention", label: "Flash Attention", desc: "Enable flash attention (--flash-attn), requires FA-compatible KV cache" },
  { type: "bool", key: "noMmap", label: "No Memory Map", desc: "Disable mmap for model loading (--no-mmap)" },
  { type: "bool", key: "mlock", label: "mlock", desc: "Lock model in RAM, prevent swapping (--mlock)" },

  // Sampling
  { type: "number", key: "temperature", label: "Temperature", desc: "Sampling temperature (--temp), 0=greedy, higher=creative", step: 0.05 },
  { type: "number", key: "topK", label: "Top-K", desc: "Top-K sampling (--top-k), 0=disabled", step: 1 },
  { type: "number", key: "topP", label: "Top-P", desc: "Nucleus sampling threshold (--top-p)", step: 0.05 },
  { type: "number", key: "minP", label: "Min-P", desc: "Min probability threshold (--min-p)", step: 0.01 },
  { type: "number", key: "repetitionPenalty", label: "Repetition Penalty", desc: "Penalize repeated tokens (--repeat-penalty), 1.0=off", step: 0.05 },
  { type: "number", key: "frequencyPenalty", label: "Frequency Penalty", desc: "Frequency-based repetition penalty (--frequency-penalty)", step: 0.05 },
  { type: "number", key: "presencePenalty", label: "Presence Penalty", desc: "Presence-based repetition penalty (--presence-penalty)", step: 0.05 },

  // MTP / Draft (speculative decoding)
  { type: "number", key: "draftMax", label: "Draft Max (MTP)", desc: "Max draft tokens for speculative decoding (--draft-max), 0=disabled", step: 1 },
  { type: "number", key: "draftMin", label: "Draft Min (MTP)", desc: "Min draft tokens to generate (--draft-min)", step: 1 },
  { type: "number", key: "draftPMin", label: "Draft P-Min (MTP)", desc: "Min acceptance probability for draft (--draft-p-min)", step: 0.05 },

  // Server
  { type: "text", key: "host", label: "Host", desc: "Server bind address (--host)" },
  { type: "number", key: "port", label: "Port", desc: "Server port (--port)", step: 1 },
  { type: "text", key: "apiKey", label: "API Key", desc: "Optional API key for auth (--api-key)" },

  // LoRA
  { type: "text", key: "loraPath", label: "LoRA Path", desc: "Path to LoRA adapter file (--lora)" },
  { type: "number", key: "loraScale", label: "LoRA Scale", desc: "LoRA adapter strength multiplier (--lora-scale)", step: 0.1 },

  // Prompt
  { type: "select", key: "chatTemplate", label: "Chat Template", desc: "Chat template format (--chat-template)", options: CHAT_TEMPLATES },
  { type: "text", key: "systemPrompt", label: "System Prompt", desc: "Default system prompt (--system-prompt)" },

  // Custom
  { type: "text", key: "customFlags", label: "Custom Flags", desc: "Extra flags passed verbatim to llama-server" },
];

export function ProfileEditor({
  theme,
  profile,
  models,
  onSave,
  onCancel,
}: ProfileEditorProps) {
  const { maxContainerColumns } = useResponsiveLayout();
  
  const [draft, setDraft] = useState<LlamaProfile>({ ...profile });
  const [fieldIdx, setFieldIdx] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState("");
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modelPickerIdx, setModelPickerIdx] = useState(0);

  const currentField = FIELDS[fieldIdx];
  const VISIBLE = 18;
  const scrollOffset = Math.max(0, fieldIdx - Math.floor(VISIBLE / 2));
  const visibleFields = FIELDS.slice(scrollOffset, scrollOffset + VISIBLE);

  const getVal = (field: FieldDef): string => {
    const raw = draft[field.key as keyof LlamaProfile];
    if (typeof raw === "boolean") return raw ? "true" : "false";
    return String(raw ?? "");
  };

  const applyVal = useCallback(
    (val: string) => {
      if (!currentField) return;
      const key = currentField.key as keyof LlamaProfile;
      setDraft((prev) => {
        const updated = { ...prev };
        if (currentField.type === "number") {
          const n = parseFloat(val);
          (updated as any)[key] = isNaN(n) ? (prev as any)[key] : n;
        } else if (currentField.type === "bool") {
          (updated as any)[key] = val === "true";
        } else {
          (updated as any)[key] = val;
        }
        return updated;
      });
    },
    [currentField]
  );

  useInput(
    (input, key) => {
      if (modelPickerOpen) {
        if (key.upArrow) setModelPickerIdx((p) => Math.max(0, p - 1));
        else if (key.downArrow) setModelPickerIdx((p) => Math.min(models.length - 1, p + 1));
        else if (key.return) {
          const m = models[modelPickerIdx];
          if (m) setDraft((prev) => ({ ...prev, modelPath: m.path }));
          setModelPickerOpen(false);
        } else if (key.escape) {
          setModelPickerOpen(false);
        }
        return;
      }

      if (editing) {
        if (key.return || key.escape) {
          if (key.return) applyVal(editVal);
          setEditing(false);
        }
        return;
      }

      if (key.escape) { onCancel(); return; }
      if (input === "s" && key.ctrl) { onSave(draft); return; }

      if (key.upArrow) setFieldIdx((p) => Math.max(0, p - 1));
      else if (key.downArrow) setFieldIdx((p) => Math.min(FIELDS.length - 1, p + 1));
      else if (key.pageUp) setFieldIdx((p) => Math.max(0, p - 8));
      else if (key.pageDown) setFieldIdx((p) => Math.min(FIELDS.length - 1, p + 8));
      else if (key.home) setFieldIdx(0);
      else if (key.end) setFieldIdx(FIELDS.length - 1);
      else if (key.return || input === " " || input === "e") {
        if (!currentField) return;
        if (currentField.type === "model") {
          setModelPickerOpen(true);
          const curIdx = models.findIndex((m) => m.path === draft.modelPath);
          setModelPickerIdx(curIdx >= 0 ? curIdx : 0);
          return;
        }
        if (currentField.type === "bool") {
          const curVal = draft[currentField.key as keyof LlamaProfile] as boolean;
          setDraft((prev) => ({ ...prev, [currentField.key]: !curVal }));
          return;
        }
        if (currentField.type === "select") {
          const options = (currentField as any).options as string[];
          const cur = getVal(currentField);
          const idx = options.indexOf(cur);
          const next = options[(idx + 1) % options.length];
          setDraft((prev) => ({ ...prev, [currentField.key]: next }));
          return;
        }
        setEditVal(getVal(currentField));
        setEditing(true);
      } else if (key.leftArrow || key.rightArrow) {
        if (!currentField) return;
        if (currentField.type === "number") {
          const step = (currentField as any).step ?? 1;
          const cur = draft[currentField.key as keyof LlamaProfile] as number;
          const next = key.leftArrow ? cur - step : cur + step;
          const rounded = Math.round(next * 1000) / 1000;
          setDraft((prev) => ({ ...prev, [currentField.key]: rounded }));
        }
        if (currentField.type === "select" || currentField.type === "bool") {
          if (currentField.type === "bool") {
            const curVal = draft[currentField.key as keyof LlamaProfile] as boolean;
            setDraft((prev) => ({ ...prev, [currentField.key]: !curVal }));
          } else {
            const options = (currentField as any).options as string[];
            const cur = getVal(currentField);
            const idx = options.indexOf(cur);
            const next = key.leftArrow
              ? options[(idx - 1 + options.length) % options.length]
              : options[(idx + 1) % options.length];
            setDraft((prev) => ({ ...prev, [currentField.key]: next }));
          }
        }
      }
    },
    { isActive: true }
  );

  if (modelPickerOpen) {
    return (
      <ThemedBox theme={theme} title="SELECT MODEL" flexDirection="column" focused>
        {models.length === 0 ? (
          <Text color={theme.warning}>No models found. Add scan directories first.</Text>
        ) : (
          models.map((m, i) => (
            <Box key={m.path}>
              {i === modelPickerIdx ? (
                <Text color={theme.highlightFg} backgroundColor={theme.highlight} bold>
                  {` ▶ ${m.name}`.padEnd(60)}
                </Text>
              ) : (
                <Text color={theme.fg}>{"   " + m.name}</Text>
              )}
            </Box>
          ))
        )}
        <Box marginTop={1}>
          <Text color={theme.dim}>↑↓ navigate  ↵ select  ESC cancel</Text>
        </Box>
      </ThemedBox>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1} alignItems="center" backgroundColor={theme.bg}>
      <Box
        flexDirection="row"
        width={maxContainerColumns}
        flexGrow={1}
        gap={1}
      >
        {/* Fields list */}
        <ThemedBox theme={theme} title={`EDIT: ${draft.name}`} width={52} flexDirection="column" focused>
          {visibleFields.map((field, i) => {
            const realIdx = i + scrollOffset;
            const isSelected = realIdx === fieldIdx;
            const val = getVal(field);
            const isModel = field.type === "model";
            const displayVal = isModel
              ? (draft.modelPath ? draft.modelPath.split("/").pop() ?? "—" : "(none)")
              : val;
            const isBool = field.type === "bool";
            const boolColor = val === "true" ? theme.success : theme.dim;

            return (
              <Box key={field.key} gap={1}>
                {isSelected ? (
                  <>
                    <Text color={theme.accent} bold>{"▶"}</Text>
                    <Text color={theme.accent} bold>{field.label.padEnd(22)}</Text>
                    {editing ? (
                      <Box>
                        <TextInput
                          value={editVal}
                          onChange={setEditVal}
                          focus={true}
                        />
                      </Box>
                    ) : (
                      <Text color={isBool ? boolColor : theme.highlight} bold>
                        {displayVal || "(empty)"}
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text color={theme.dim}>{"  "}</Text>
                    <Text color={theme.dim}>{field.label.padEnd(22)}</Text>
                    <Text color={isBool ? (val === "true" ? theme.success : theme.dim) : theme.fg}>
                      {displayVal || "(empty)"}
                    </Text>
                  </>
                )}
              </Box>
            );
          })}
          <Text color={theme.dim}>
            {`  ${fieldIdx + 1}/${FIELDS.length}`}
          </Text>
        </ThemedBox>

        {/* Description panel */}
        <ThemedBox theme={theme} title="HELP" flexGrow={1} flexDirection="column" dimBorder>
          {currentField && (
            <Box flexDirection="column" gap={1}>
              <Text color={theme.accent} bold>{currentField.label}</Text>
              <Text color={theme.fg}>{currentField.desc}</Text>

              {currentField.type === "number" && (
                <Box flexDirection="column" marginTop={1}>
                  <Text color={theme.dim}>← → adjust by {(currentField as any).step ?? 1}</Text>
                  <Text color={theme.dim}>↵ type value directly</Text>
                </Box>
              )}
              {currentField.type === "bool" && (
                <Text color={theme.dim} marginTop={1}>↵ or SPACE to toggle</Text>
              )}
              {currentField.type === "select" && (
                <Box flexDirection="column" marginTop={1}>
                  <Text color={theme.dim}>← → or ↵ to cycle options</Text>
                  <Text color={theme.dim}>Options: {(currentField as any).options.join(", ")}</Text>
                </Box>
              )}
              {currentField.type === "model" && (
                <Text color={theme.dim} marginTop={1}>↵ to open model picker</Text>
              )}
              {currentField.type === "text" && (
                <Text color={theme.dim} marginTop={1}>↵ to edit text  ESC to cancel edit</Text>
              )}
            </Box>
          )}
        </ThemedBox>
      </Box>

      <HintBar
        theme={theme}
        hints={[
          { key: "↑↓", desc: "navigate" },
          { key: "↵/SPACE", desc: "edit/toggle" },
          { key: "←→", desc: "adjust" },
          { key: "Ctrl+S", desc: "save" },
          { key: "ESC", desc: "cancel" },
        ]}
      />
    </Box>
  );
}
