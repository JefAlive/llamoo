import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Box, Text, useInput, useStdout, useWindowSize } from "ink";
import TextInput from "ink-text-input";
import type { Theme, LlamaProfile, GgufModel, AppScreen } from "../types/index.js";
import { Logo } from "./Logo.js";
import { HintBar } from "./StatusBar.js";
import { formatBytes, formatTokens } from "../utils/llama.js";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout.js";

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

export function ProfilesScreen({
  theme,
  profiles,
  models,
  onNavigate,
  onDeleteProfile,
  onAddProfile,
  onEditProfile,
  onRunProfile,
  onChangeTheme,
  onChangeDir,
  onSyncModels,
}: ProfilesScreenProps) {
  const { stdout } = useStdout();
  const { isDesktop, maxContainerColumns } = useResponsiveLayout();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
      if (input === "t") { onChangeTheme(); return; }
      if (input === "d") { onChangeDir(); return; }
      if (input === "s") { onSyncModels(); return; }
      if (input === "a") { onAddProfile(); return; }
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
    if (!selected?.name) return '—';

    const modelFilename = selected.modelPath.split("/").pop() || '—';
    const modelName = modelFilename.replace(/.gguf$/gi, "")

    return modelName.replaceAll("-", " ");
  }, [selectedModel])

  const visibleItems = filteredProfiles.slice(scrollOffset, scrollOffset + listHeight);

  return (
    <Box flexDirection="column" flexGrow={1} alignItems="center" backgroundColor={theme.bg}>
      <Box flexDirection="column" width={maxContainerColumns} alignItems="center" justifyContent="space-around" paddingY={1} gap={1} flexGrow={1}>
        {/* Main content */}
        <Box flexShrink={0}>
          <Logo theme={theme} />
        </Box>

        <Box flexDirection="row" justifyContent="center" alignItems="center" gap={2} flexShrink={1}>
          {/* Left: profile list */}
          <Box
            flexDirection="column"
            width={Math.floor(maxContainerColumns * (isDesktop ? 0.6 : 0.5))}
            height="100%"
            justifyContent="flex-start"
            gap={1}
          >
            <Box flexShrink={0}>
              <Text color={theme.dim} bold>
                {'// models'}
              </Text>
            </Box>

            {models.length === 0 && (
              <Box
                flexDirection="column"
                paddingLeft={1}
                borderStyle={{
                  topLeft: '',
                  top: '',
                  topRight: '',
                  left: '▌',
                  bottomLeft: '',
                  bottom: '',
                  bottomRight: '',
                  right: '▐',
                }}
                borderColor={theme.warning}
                borderTop={false}
                borderRight={false}
                borderBottom={false}
                borderBackgroundColor={theme.bg}
                backgroundColor={theme.bg}
              >
                <Text color={theme.warning} bold>No models detected.</Text>
                <Text color={theme.warning}>Press [d] to configure your model directory.</Text>
              </Box>
            )}

            {models.length > 0 && (
              <Box>
                <Text color={theme.fg}>
                  {`   ${models.length} ${models.length === 1 ? "model" : "models"} detected`}
                </Text>
              </Box>
            )}

            {(models.length > 0 || profiles.length > 0) && (
              <Box>
                <Text color={theme.dim} bold>
                  {'// profiles'}
                </Text>
                {(searching || searchQuery) && (
                  <>
                    <Text color={theme.accent} bold={searching}>{".filter( /"}</Text>
                    <TextInput
                      value={searchQuery}
                      onChange={setSearchQuery}
                      onSubmit={() => setSearching(false)}
                      focus={searching}
                    />
                    <Text color={theme.accent} bold={searching}>{"/ )"}</Text>
                  </>
                )}
              </Box>
            )}

            {models.length > 0 && profiles.length === 0 && (
              <Box>
                <Text color={theme.warning}>Press [a] to add a profile.</Text>
              </Box>
            )}

            {profiles.length > 0 && filteredProfiles.length === 0 && (
              <Box>
                <Text color={theme.dim}>
                  No results for your search.
                </Text>
              </Box>
            )}

            <Box flexDirection="column">
              {visibleItems.map((profile, i) => {
                const realIdx = i + scrollOffset;
                const isSelected = realIdx === selectedIdx;
                return (
                  <Box key={profile.id} flexDirection="row" paddingX={3} height={1} backgroundColor={isSelected ? theme.accent : undefined}>
                    <Text color={isSelected ? theme.bg : theme.fg} bold={isSelected} wrap="truncate-middle">
                      {profile.name}
                    </Text>
                  </Box>
                );
              })}
              {filteredProfiles.length > listHeight && (
                <Text color={theme.dim}>
                  {`  ${scrollOffset + 1}-${Math.min(scrollOffset + listHeight, filteredProfiles.length)} of ${filteredProfiles.length}`}
                </Text>
              )}
            </Box>
          </Box>

          {/* Right: profile details */}
          <Box
            flexDirection="column"
            width={Math.floor(maxContainerColumns * (isDesktop ? 0.4 : 0.5))}
            height="100%"
            borderStyle={profiles.length === 0 ? undefined : "round"}
            borderColor={theme.border}
            borderBackgroundColor={theme.bg}
            paddingX={2}
            paddingY={1}
          >
            {selected && (
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
                  <DetailRow theme={theme} label="Context" value={`${formatTokens(selected.contextSize)} tokens`} />
                  <DetailRow theme={theme} label="GPU Layers" value={selected.gpuLayers === 0 ? "CPU only" : String(selected.gpuLayers)} />
                  <DetailRow theme={theme} label="Flash Attn" value={selected.flashAttention ? "yes" : "no"} accent={selected.flashAttention} />
                  <DetailRow theme={theme} label="KV Cache K/V" value={`${selected.kvCacheTypeK} / ${selected.kvCacheTypeV}`} />
                  <DetailRow theme={theme} label="Temperature" value={String(selected.temperature)} />
                  <DetailRow theme={theme} label="Top-K / Top-P" value={`${selected.topK} / ${selected.topP}`} />
                  <DetailRow theme={theme} label="Rep. Penalty" value={String(selected.repetitionPenalty)} />
                  {selected.draftMax > 0 && (
                    <DetailRow theme={theme} label="Draft (MTP)" value={`min=${selected.draftMin} max=${selected.draftMax}`} accent />
                  )}
                  <DetailRow theme={theme} label="Server" value={`${selected.host}:${selected.port}`} />
                  {selected.loraPath && (
                    <DetailRow theme={theme} label="LoRA" value={selected.loraPath.split("/").pop() ?? ""} accent />
                  )}
                  {selected.customFlags && (
                    <DetailRow theme={theme} label="Custom Flags" value={selected.customFlags} />
                  )}
                </Box>

                {confirmDelete === selected.id && (
                  <Box marginTop={1}>
                    <Text color={theme.error} bold>
                      Delete "{selected.name}"? [y] yes  [any] cancel
                    </Text>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Hint bar */}
      <HintBar
        theme={theme}
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
    </Box>
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
