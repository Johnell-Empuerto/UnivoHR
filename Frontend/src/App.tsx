import AppRoutes from "./app/routes/routes";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { Toaster } from "sonner";

const App = () => {
  return (
    <>
      {" "}
      <ErrorBoundary name="application">
        <AppRoutes />
      </ErrorBoundary>
      <Toaster />
    </>
  );
};

export default App;
