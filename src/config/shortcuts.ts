import { ShortcutAction } from "@/types";

export const DEFAULT_SHORTCUT_ACTIONS: ShortcutAction[] = [
  {
    id: "toggle_dashboard",
    name: "Toggle Main Window",
    description: "Open/Close the chat & settings window",
    defaultKey: { macos: "cmd+shift+d", windows: "ctrl+shift+d", linux: "alt+shift+d" },
  },
  {
    id: "toggle_window",
    name: "Toggle Mini Overlay",
    description: "Show/Hide the mini prompt overlay",
    defaultKey: { macos: "cmd+backslash", windows: "ctrl+backslash", linux: "alt+backslash" },
  },
  {
    id: "focus_input",
    name: "Refocus Input Box",
    description: "Bring overlay forward and place cursor in the input area",
    defaultKey: { macos: "cmd+shift+i", windows: "ctrl+shift+i", linux: "alt+shift+i" },
  },
  {
    id: "move_window",
    name: "Move Overlay",
    description: "Move overlay with arrow keys",
    defaultKey: { macos: "cmd", windows: "ctrl", linux: "alt" },
  },
  {
    id: "audio_recording",
    name: "Toggle Recording (Mic/System)",
    description: "Start/Stop recording audio",
    defaultKey: { macos: "cmd+shift+a", windows: "ctrl+shift+a", linux: "alt+shift+a" },
  },
  {
    id: "screenshot",
    name: "Take Screenshot",
    description: "Capture screenshot",
    defaultKey: { macos: "cmd+shift+s", windows: "ctrl+shift+s", linux: "alt+shift+s" },
  },
];