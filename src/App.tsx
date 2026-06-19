import React, { useState, useCallback } from "react";
import { Box, useApp, useWindowSize } from "ink";
import type { ThemeName, LlamaProfile, AppScreen } from "./types/index";
import { getTheme } from "./themes/index";
import {
  getThemeName, setThemeName,
  getScanDirs, setScanDirs,
  getProfiles, saveProfile, deleteProfile,
  getModels, setModels,
  makeDefaultProfile,
} from "./store/config.js";
import { scanForModels } from "./utils/llama";
import { ProfilesScreen } from "./components/pages/ProfilesScreen";
import { ProfileEditor } from "./components/pages/ProfileEditor";
import { ThemePicker } from "./components/pages/ThemePicker";
import { DirManager } from "./components/pages/DirManager";
import { RunnerScreen } from "./components/pages/RunnerScreen";

// Detect llama-server binary
function findLlamaServer(): string {
  const candidates = [
    "llama-server",
    "llama.cpp/build/bin/llama-server",
    "./llama-server",
  ];
  // Return the first one — spawn will fail if not found
  const envBin = process.env.LLAMA_SERVER_BIN;
  return envBin ?? candidates[0];
}

export function App() {
  const { exit } = useApp();
  const { rows } = useWindowSize();

  const [screen, setScreen] = useState<AppScreen>("profiles");
  const [themeName, setThemeNameState] = useState<ThemeName>(getThemeName());
  const [scanDirs, setScanDirsState] = useState<string[]>(getScanDirs());
  const [models, setModelsState] = useState(getModels());
  const [profiles, setProfilesState] = useState<LlamaProfile[]>(getProfiles());
  const [editingProfile, setEditingProfile] = useState<LlamaProfile | null>(null);
  const [runningProfile, setRunningProfile] = useState<LlamaProfile | null>(null);

  const theme = getTheme(themeName);

  const refreshProfiles = useCallback(() => {
    setProfilesState(getProfiles());
  }, []);

  const handleThemeSelect = useCallback((name: ThemeName) => {
    setThemeNameState(name);
    setThemeName(name);
    setScreen("profiles");
  }, []);

  const handleSaveDirs = useCallback((dirs: string[]) => {
    setScanDirsState(dirs);
    setScanDirs(dirs);
    setScreen("profiles");
  }, []);

  const handleSyncModels = useCallback(() => {
    const found = scanForModels(scanDirs);
    setModelsState(found);
    setModels(found);
    setScreen("profiles");
  }, [scanDirs]);

  const handleAddProfile = useCallback(() => {
    const firstModel = models[0];
    const profile = makeDefaultProfile(
      firstModel?.path ?? "",
      firstModel?.name ?? "new-model"
    );
    setEditingProfile(profile);
    setScreen("profile-edit");
  }, [models]);

  const handleEditProfile = useCallback((profile: LlamaProfile) => {
    setEditingProfile({ ...profile });
    setScreen("profile-edit");
  }, []);

  const handleSaveProfile = useCallback((profile: LlamaProfile) => {
    saveProfile(profile);
    refreshProfiles();
    setEditingProfile(null);
    setScreen("profiles");
  }, [refreshProfiles]);

  const handleDeleteProfile = useCallback((id: string) => {
    deleteProfile(id);
    refreshProfiles();
  }, [refreshProfiles]);

  const handleRunProfile = useCallback((profile: LlamaProfile) => {
    setRunningProfile(profile);
    setScreen("profile-run");
  }, []);

  const handleRunnerExit = useCallback(() => {
    setRunningProfile(null);
    setScreen("profiles");
  }, []);

  const llamaBin = findLlamaServer();

  return (
    <Box flexDirection="column" flexGrow={1} height={rows}>
      {screen === "profiles" && (
        <ProfilesScreen
          theme={theme}
          profiles={profiles}
          models={models}
          onNavigate={setScreen}
          onDeleteProfile={handleDeleteProfile}
          onAddProfile={handleAddProfile}
          onEditProfile={handleEditProfile}
          onRunProfile={handleRunProfile}
          onChangeTheme={() => setScreen("theme-picker")}
          onChangeDir={() => setScreen("dir-manager")}
          onSyncModels={handleSyncModels}
        />
      )}

      {screen === "profile-edit" && editingProfile && (
        <ProfileEditor
          theme={theme}
          profile={editingProfile}
          models={models}
          onSave={handleSaveProfile}
          onCancel={() => {
            setEditingProfile(null);
            setScreen("profiles");
          }}
        />
      )}

      {screen === "theme-picker" && (
        <ThemePicker
          theme={theme}
          currentTheme={themeName}
          onSelect={handleThemeSelect}
          onCancel={() => setScreen("profiles")}
        />
      )}

      {screen === "dir-manager" && (
        <DirManager
          theme={theme}
          dirs={scanDirs}
          onSave={handleSaveDirs}
          onCancel={() => setScreen("profiles")}
        />
      )}

      {screen === "profile-run" && runningProfile && (
        <RunnerScreen
          theme={theme}
          profile={runningProfile}
          llamaServerBin={llamaBin}
          onExit={handleRunnerExit}
        />
      )}
    </Box>
  );
}
