import { MicIcon, LoaderCircleIcon, SquareIcon } from "lucide-react";
import {Button } from "@/components";
import { UseCompletionReturn } from "@/types";

export const Audio = ({
  isRecording,
  isTranscribing,
  toggleManualRecording,
}: UseCompletionReturn) => {

    if (isTranscribing) {
      return (
        <Button size="icon" disabled variant="outline" className="cursor-not-allowed">
          <LoaderCircleIcon className="h-4 w-4 animate-spin text-green-500" />
        </Button>
      );
    }

    return (
      <Button
        size="icon"
        onClick={toggleManualRecording}
        variant={isRecording ? "default" : "ghost"}
        className="cursor-pointer transition-all"
        title={isRecording ? "Stop recording & process" : "Start manual recording"}
      >
        {isRecording ? (
          <SquareIcon className="h-3 w-3 fill-red-500 text-red-500 animate-pulse" />
        ) : (
          <MicIcon className="h-4 w-4" />
        )}
      </Button>
    );
};