import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
const App = lazy(() => import("./App"));
const StudioPage = lazy(() => import("./StudioPage"));
const isStudio = /^\/studio(?:\/|$)/.test(window.location.pathname);
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isStudio ? (
      <Suspense
        fallback={
          <div className="content-status" role="status">
            Loading Nufa Media Studio…
          </div>
        }
      >
        <StudioPage />
      </Suspense>
    ) : (
      <Suspense
        fallback={
          <div role="status" style={{ padding: 40, fontFamily: "system-ui" }}>
            Loading Nufa Media…
          </div>
        }
      >
        <App />
      </Suspense>
    )}
  </React.StrictMode>,
);
