import {
  Dispatch,
  SetStateAction,
  RefObject,
  KeyboardEvent,
  ChangeEvent,
  ClipboardEvent,
} from "react";

export interface UseCompletionReturn {
  // Input management
  input: string;
  setInput: (value: string) => void;

  // Response management
  response: string;
  setResponse: (value: string) => void;

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // File attachment management
  attachedFiles: any[];
  addFile: (file: File) => Promise<void>;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;

  // Completion actions
  submit: (speechText?: string) => Promise<void>;
  cancel: () => void;
  reset: () => void;

  // State management
  setState: Dispatch<SetStateAction<any>>;

  // Manual Native Audio Recording
  isRecording: boolean;
  setIsRecording: Dispatch<SetStateAction<boolean>>;
  isTranscribing: boolean;
  toggleManualRecording: () => Promise<void>;

  // Microphone Setup Warning Popover
  micOpen: boolean;
  setMicOpen: Dispatch<SetStateAction<boolean>>;

  // Conversation management
  currentConversationId: string | null;
  conversationHistory: any[];
  loadConversation: (conversation: any) => void;
  startNewConversation: () => void;

  // UI state management
  messageHistoryOpen: boolean;
  setMessageHistoryOpen: Dispatch<SetStateAction<boolean>>;
  keepEngaged: boolean;
  setKeepEngaged: Dispatch<SetStateAction<boolean>>;

  // Screenshot functionality
  screenshotConfiguration: any;
  setScreenshotConfiguration: Dispatch<SetStateAction<any>>;
  handleScreenshotSubmit: (base64: string, prompt?: string) => Promise<void>;

  // File selection and keyboard handling
  handleFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
  handleKeyPress: (e: KeyboardEvent) => void;
  handlePaste: (e: ClipboardEvent) => Promise<void>;

  // UI helpers and computed values
  isPopoverOpen: boolean;
  scrollAreaRef: RefObject<HTMLDivElement | null>;
  resizeWindow: (expanded: boolean) => Promise<void>;

  // Files popover management
  isFilesPopoverOpen: boolean;
  setIsFilesPopoverOpen: Dispatch<SetStateAction<boolean>>;
  onRemoveAllFiles: () => void;

  inputRef: RefObject<HTMLInputElement | null>;
  captureScreenshot: () => Promise<void>;
  isScreenshotLoading: boolean;
}

export type UseCompletionHook = () => UseCompletionReturn;