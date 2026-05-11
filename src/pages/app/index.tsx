import { Completion } from "./components";
import { useApp } from "@/hooks";

const App = () => {
  const { isHidden } = useApp();

  return (
      <div
        data-slot="card"
        className={`w-screen h-screen flex overflow-hidden flex-col ${
          isHidden ? "hidden pointer-events-none" : ""
        }`}
      >
        <Completion isHidden={isHidden} />
      </div>
  );
};

export default App;