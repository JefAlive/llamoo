import { Box, Text, useInput, useStdout } from "ink";
import TextInput from "ink-text-input";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AppScreen,
  GgufModel,
  LlamaProfile,
  Theme,
} from "../../types/index";
import { formatBytes } from "../../utils/llama";
import { petEvents, toast } from "../../utils/petEvents";
import { AlertBox } from "../ui/AlertBox";
import { Logo } from "../ui/Logo";
import { PageLayout } from "../ui/PageLayout";
import { SelectableList } from "../ui/SelectableList";
import { Title } from "../ui/Title";

interface ProfilesScreenProps {
  theme: Theme;
  profiles: LlamaProfile[];
  models: GgufModel[];
  onNavigate: (screen: AppScreen) => void;
  onDeleteProfile: (id: string) => void;
  onAddProfile: () => void;
  onEditProfile: (profile: LlamaProfile) => void;
  onRunProfile: (profile: LlamaProfile) => void;
  onChangeTheme: () => void;
  onChangeDir: () => void;
  onSyncModels: () => void;
}

const WELCOME_MESSAGES = [
  "Moo! Ops, I'm a little lost.\n\nLet's configure your models folder to get started :)",
];

export function ProfilesScreen({
  theme,
  profiles,
  models,
  onDeleteProfile,
  onAddProfile,
  onEditProfile,
  onRunProfile,
  onChangeTheme,
  onChangeDir,
  onSyncModels,
}: ProfilesScreenProps) {
  const { stdout } = useStdout();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [petLoaded, setPetLoaded] = useState(false);
  const [isAlertBlinking, setIsAlertBlinking] = useState(false);
  const petRef = useRef(null);

  const filteredProfiles = profiles.filter((p) =>
    searchQuery === ""
      ? true
      : p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const clampIdx = useCallback(
    (idx: number) => Math.max(0, Math.min(idx, filteredProfiles.length - 1)),
    [filteredProfiles.length]
  );

  const termHeight = stdout?.rows ?? 24;
  const listHeight = Math.max(4, termHeight - 12);

  // Scroll offset
  const [scrollOffset, setScrollOffset] = useState(0);
  useEffect(() => {
    if (selectedIdx < scrollOffset) {
      setScrollOffset(selectedIdx);
    } else if (selectedIdx >= scrollOffset + listHeight) {
      setScrollOffset(selectedIdx - listHeight + 1);
    }
  }, [selectedIdx, scrollOffset, listHeight]);

  useInput(
    (input, key) => {
      if (searching) return;

      if (confirmDelete) {
        if (input === "y" || input === "Y") {
          onDeleteProfile(confirmDelete);
          setConfirmDelete(null);
          setSelectedIdx((prev) => clampIdx(prev));
        } else {
          setConfirmDelete(null);
        }
        return;
      }

      if (input === "/") {
        setSearching(true);
        setSelectedIdx(0);
        return;
      }
      if (input === "t") {
        onChangeTheme();
        return;
      }
      if (input === "d") {
        onChangeDir();
        return;
      }
      if (input === "s") {
        onSyncModels();
        return;
      }
      if (input === "a") {
        onAddProfile();
        return;
      }
      if (input === "e" || key.return) {
        if (filteredProfiles[selectedIdx]) {
          onEditProfile(filteredProfiles[selectedIdx]);
        }
        return;
      }
      if (input === "r") {
        if (filteredProfiles[selectedIdx]) {
          onRunProfile(filteredProfiles[selectedIdx]);
        }
        return;
      }
      if (input === "x") {
        if (filteredProfiles[selectedIdx]) {
          setConfirmDelete(filteredProfiles[selectedIdx].id);
        }
        return;
      }

      if (key.upArrow) {
        setSelectedIdx((prev) => clampIdx(prev - 1));
      } else if (key.downArrow) {
        setSelectedIdx((prev) => clampIdx(prev + 1));
      } else if (key.pageUp) {
        setSelectedIdx((prev) => clampIdx(prev - Math.floor(listHeight / 2)));
      } else if (key.pageDown) {
        setSelectedIdx((prev) => clampIdx(prev + Math.floor(listHeight / 2)));
      } else if (key.home || input === "g") {
        setSelectedIdx(0);
      } else if (key.end || input === "G") {
        setSelectedIdx(clampIdx(filteredProfiles.length - 1));
      }
    },
    { isActive: true }
  );

  const selected = filteredProfiles[selectedIdx];
  const selectedModel = selected
    ? models.find((m) => m.path === selected.modelPath)
    : undefined;

  const modelName = useMemo(() => {
    if (!selected?.name) return "—";

    const modelFilename = selected.modelPath.split("/").pop() || "—";
    const modelName = modelFilename.replace(/.gguf$/gi, "");

    return modelName.replaceAll("-", " ");
  }, [selectedModel]);

  useEffect(() => {
    if (!petLoaded) {
      if (models.length === 0) {
        const messageId = toast(
          WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)]
        );

        const handleWelcomeToastFinished = (finishedMessageId: string) => {
          if (finishedMessageId === messageId) {
            setIsAlertBlinking(true);
            petEvents.off("toastFinished", handleWelcomeToastFinished);
          }
        };

        petEvents.on("toastFinished", handleWelcomeToastFinished);
      }

      if (models.length > 0 && profiles.length === 0) {
        const messageId = toast(
          "Crunch-crunch..\nA profile is a set of parameteres to run a model.\nUse [a] to create one."
        );

        const handleConfigureProfileToastFinished = (
          finishedMessageId: string
        ) => {
          if (finishedMessageId === messageId) {
            setIsAlertBlinking(true);
            petEvents.off("toastFinished", handleConfigureProfileToastFinished);
          }
        };

        petEvents.on("toastFinished", handleConfigureProfileToastFinished);
      }

      setPetLoaded(true);
    }
  }, [petRef]);

  return (
    <PageLayout
      theme={theme}
      hasBorder={profiles.length > 0}
      header={<Logo theme={theme} />}
      leftColumn={
        <Box flexDirection="column" gap={1}>
          <Box flexShrink={0}>
            <Title title="models" theme={theme} />
          </Box>

          {models.length === 0 && (
            <AlertBox
              message="No models found. Press [d] to configure your model directory."
              theme={theme}
              blinking={isAlertBlinking}
            />
          )}

          {models.length > 0 && (
            <Box gap={1}>
              <Text color={theme.dim}>{`░`}</Text>
              <Text color={theme.fg}>
                {`${models.length} ${models.length === 1 ? "model" : "models"} detected`}
              </Text>
            </Box>
          )}

          {(models.length > 0 || profiles.length > 0) && (
            <Box marginBottom={1}>
              <Title title="profiles" theme={theme} />

              {(searching || searchQuery) && (
                <>
                  <Text color={theme.accent} bold={searching}>
                    {".filter( /"}
                  </Text>
                  <TextInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSubmit={() => setSearching(false)}
                    focus={searching}
                  />
                  <Text color={theme.accent} bold={searching}>
                    {"/ )"}
                  </Text>
                </>
              )}
            </Box>
          )}

          {models.length > 0 && profiles.length === 0 && (
            <AlertBox
              message="Press [a] to add a profile."
              theme={theme}
              blinking={isAlertBlinking}
            />
          )}

          <SelectableList
            items={filteredProfiles.map((p) => ({ id: p.id, label: p.name }))}
            selectedIdx={selectedIdx}
            theme={theme}
          />
        </Box>
      }
      rightColumn={
        selected && (
          <Box flexDirection="column">
            <Box>
              <Box flexShrink={0}>
                <Text color={theme.dim}>Model: </Text>
              </Box>
              <Box flexShrink={1}>
                <Text color={theme.fg} bold>
                  {modelName}
                </Text>
              </Box>
            </Box>
            <Box>
              <Box flexShrink={0}>
                <Text color={theme.dim}>Size: </Text>
              </Box>
              <Box flexShrink={1}>
                <Text color={theme.fg} bold>
                  {formatBytes(selectedModel?.sizeBytes || 0)}
                </Text>
              </Box>
            </Box>

            <Box
              flexDirection="column"
              gap={0}
              borderStyle="round"
              borderColor={theme.border}
              borderBackgroundColor={theme.bg}
              borderTop={true}
              borderRight={false}
              borderBottom={false}
              borderLeft={false}
            >
              <DetailRow
                theme={theme}
                label="Context"
                value={`${selected.contextSize}${selected.contextUnit || ""} tokens`}
              />
              <DetailRow
                theme={theme}
                label="GPU Layers"
                value={
                  selected.gpuLayers === 0
                    ? "CPU only"
                    : String(selected.gpuLayers)
                }
              />
              <DetailRow
                theme={theme}
                label="Flash Attn"
                value={selected.flashAttention ? "yes" : "no"}
                accent={selected.flashAttention}
              />
              <DetailRow
                theme={theme}
                label="KV Cache K/V"
                value={`${selected.kvCacheTypeK} / ${selected.kvCacheTypeV}`}
              />
              <DetailRow
                theme={theme}
                label="Temperature"
                value={String(selected.temperature)}
              />
              <DetailRow
                theme={theme}
                label="Top-K / Top-P"
                value={`${selected.topK} / ${selected.topP}`}
              />
              <DetailRow
                theme={theme}
                label="Rep. Penalty"
                value={String(selected.repetitionPenalty)}
              />
              {selected.draftMax > 0 && (
                <DetailRow
                  theme={theme}
                  label="Draft (MTP)"
                  value={`min=${selected.draftMin} max=${selected.draftMax}`}
                  accent
                />
              )}
              <DetailRow
                theme={theme}
                label="Server"
                value={`${selected.host}:${selected.port}`}
              />
              {selected.loraPath && (
                <DetailRow
                  theme={theme}
                  label="LoRA"
                  value={selected.loraPath.split("/").pop() ?? ""}
                  accent
                />
              )}
              {selected.customFlags && (
                <DetailRow
                  theme={theme}
                  label="Custom Flags"
                  value={selected.customFlags}
                />
              )}
            </Box>

            {confirmDelete === selected.id && (
              <Box marginTop={1}>
                <Text color={theme.error} bold>
                  Delete "{selected.name}"? [y] yes [any] cancel
                </Text>
              </Box>
            )}
          </Box>
        )
      }
      hints={[
        { key: "↑↓", desc: "navigate" },
        { key: "a", desc: "add" },
        { key: "e/↵", desc: "edit" },
        { key: "r", desc: "run" },
        { key: "x", desc: "delete" },
        { key: "/", desc: "search" },
        { key: "t", desc: "theme" },
        { key: "d", desc: "dirs" },
        { key: "s", desc: "sync" },
      ]}
    />
  );
}

function DetailRow({
  theme,
  label,
  value,
  accent,
}: {
  theme: Theme;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Box gap={1}>
      <Text color={theme.dim}>{label.padEnd(14)}</Text>
      <Text color={accent ? theme.accent : theme.fg}>{value}</Text>
    </Box>
  );
}
