import AppRoutes from "./app/routes/routes";
import { Toaster } from "sonner";

const App = () => {
  return (
    <>
      {" "}
      <AppRoutes />
      <Toaster />
    </>
  );
};

export default App;
