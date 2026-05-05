// src/pages/shortcuts/components/shortcuts/ShortcutRecorder.tsx
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components";
import { Check, X } from "lucide-react";
import {
  getPlatform,
  validateShortcutKey,
  formatShortcutKeyForDisplay,
} from "@/lib";

interface ShortcutRecorderProps {
  onSave: (key: string) => void;
  onCancel: () => void;
  disabled?: boolean;
  actionId?: string;
}

export const ShortcutRecorder = ({
  onSave,
  onCancel,
  disabled = false,
  actionId,
}: ShortcutRecorderProps) => {
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const isRecording = true; 
  const isMoveWindow = actionId === "move_window";
  const minKeys = isMoveWindow ? 1 : 2;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isRecording) return;

      e.preventDefault();
      e.stopPropagation();

      const keys: string[] = [];
      const platform = getPlatform();

      // FIXED: Proper modifier extraction
      if (e.metaKey || e.getModifierState("Meta") || e.getModifierState("Super")) {
        keys.push(platform === "macos" ? "cmd" : "super");
      }
      if (e.ctrlKey) keys.push("ctrl");
      if (e.altKey) keys.push("alt");
      if (e.shiftKey) keys.push("shift");

      let mainKey = e.key.toLowerCase();

      // Filter out raw modifier presses
      if (["control", "alt", "shift", "meta", "os", "super", "command"].includes(mainKey)) {
        mainKey = "";
      }

      const specialKeyMap: Record<string, string> = {
        arrowup: "up", arrowdown: "down", arrowleft: "left", arrowright: "right",
        " ": "space", escape: "esc", enter: "return", backspace: "backspace",
        delete: "delete", tab: "tab", "[": "bracketleft", "]": "bracketright",
        ";": "semicolon", "'": "quote", "`": "grave", "\\": "backslash",
        "/": "slash", ",": "comma", ".": "period", "-": "minus", "=": "equal", "+": "plus",
      };

      if (mainKey && specialKeyMap[mainKey]) {
        mainKey = specialKeyMap[mainKey];
      }

      if (mainKey) keys.push(mainKey);

      if (isMoveWindow) {
        if (["up", "down", "left", "right"].includes(mainKey)) {
          setError("Arrow keys are automatic. Only set modifiers.");
          return;
        }
        if (keys.length >= 1) {
          setRecordedKeys(keys);
          setError("");
        } else {
          setError("Must include at least one modifier");
        }
      } else {
        const hasModifier = keys.some(k => ["super", "cmd", "ctrl", "alt", "shift"].includes(k));
        
        if (hasModifier && mainKey) {
          setRecordedKeys(keys);
          setError("");
        } else {
          setError("Must include at least one modifier and one key");
        }
      }
    },
    [isRecording, isMoveWindow]
  );
  
  // ... (keep handleKeyUp, handleSave, handleCancel & UI portion identical)
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!isRecording) return;
    e.preventDefault();
    e.stopPropagation();
  }, [isRecording]);

  useEffect(() => {
    if (isRecording) {
      window.focus();
      window.addEventListener("keydown", handleKeyDown, true);
      window.addEventListener("keyup", handleKeyUp, true);

      return () => {
        window.removeEventListener("keydown", handleKeyDown, true);
        window.removeEventListener("keyup", handleKeyUp, true);
      };
    }
  }, [isRecording, handleKeyDown, handleKeyUp]);

  const handleSave = async () => {
    if (recordedKeys.length < minKeys) {
      setError(
        isMoveWindow
          ? "Move Window needs at least one modifier"
          : "Shortcut must have at least one modifier and one key"
      );
      return;
    }

    const shortcutKey = recordedKeys.join("+");

    if (!isMoveWindow) {
      if (!validateShortcutKey(shortcutKey)) {
        setError("Invalid shortcut combination");
        return;
      }
    }
    onSave(shortcutKey);
  };

  const handleCancel = () => {
    setRecordedKeys([]);
    setError("");
    onCancel();
  };

  const displayKey =
    recordedKeys.length > 0
      ? formatShortcutKeyForDisplay(recordedKeys.join("+"))
      : "Waiting for keys...";

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-2 items-center">
        <div className="flex-1">
          <div className="px-3 py-2 bg-primary/5 border-2 border-primary/50 rounded-md font-mono text-sm text-center">
            {isRecording ? (
              <span className="text-primary font-medium animate-pulse">
                ⌨️ {displayKey}
              </span>
            ) : (
              <span>{displayKey}</span>
            )}
          </div>
        </div>

        <Button
          size="sm"
          variant="default"
          onClick={handleSave}
          disabled={disabled || recordedKeys.length < minKeys}
          title="Save shortcut"
        >
          <Check className="h-4 w-4" />
          Save
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={disabled}
          title="Cancel"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      {isRecording && !error && (
        <p className="text-xs text-muted-foreground">
          {isMoveWindow
            ? "Press modifier keys (e.g., Super+Shift). Arrow keys work automatically."
            : "Press a key combination now (e.g., Super+Shift+A)"}
        </p>
      )}
      {recordedKeys.length >= minKeys && !error && (
        <p className="text-xs text-green-600">
          ✓ Shortcut captured! Click "Save" to apply.
        </p>
      )}
    </div>
  );
};