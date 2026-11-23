import { emit, listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { AppConfig, AudioCommand, AudioState } from './types';

/** Events shared between the control panel and the wallpaper window. */
export const EV = {
  config: 'deskforge:config',
  audioCmd: 'deskforge:audio-cmd',
  audioState: 'deskforge:audio-state'
} as const;

export const sendAudio = (cmd: AudioCommand) => emit(EV.audioCmd, cmd).catch(() => {});
export const broadcastConfig = (c: AppConfig) => emit(EV.config, c).catch(() => {});
export const broadcastAudioState = (s: AudioState) => emit(EV.audioState, s).catch(() => {});

export const onConfig = (cb: (c: AppConfig) => void): Promise<UnlistenFn> => listen<AppConfig>(EV.config, (e) => cb(e.payload));
export const onAudioCmd = (cb: (c: AudioCommand) => void): Promise<UnlistenFn> => listen<AudioCommand>(EV.audioCmd, (e) => cb(e.payload));
export const onAudioState = (cb: (s: AudioState) => void): Promise<UnlistenFn> => listen<AudioState>(EV.audioState, (e) => cb(e.payload));
