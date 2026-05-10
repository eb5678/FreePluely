import { Card, Button } from "@/components";
import { Completion } from "./components";
import { useApp } from "@/hooks";
import { SparklesIcon } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

const App = () => {
  const { isHidden } = useApp();

  const openDashboard = async () => {
    try {
      await invoke("open_dashboard");
    } catch (error) {
      console.error("Failed to open dashboard:", error);
    }
  };

  return (
      <div
        className={`w-screen h-screen flex overflow-hidden justify-center items-start ${
          isHidden ? "hidden pointer-events-none" : ""
        }`}
      >
        <Card className="w-full flex flex-row items-center gap-2 p-2">
          
          <div className="w-full flex flex-row gap-2 items-center">
            <Completion isHidden={isHidden} />
            <Button
              size="icon"
              className="cursor-pointer"
              title="Open Dev Space"
              onClick={openDashboard}
            >
              <SparklesIcon className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
  );
};

export default App;