import { StrictMode, useEffect, useSyncExternalStore, useState } from "react";
import { createRoot } from "react-dom/client";
import CadWorkspace from "./components/CadWorkspace";
import HelpPage from "./components/workbench/HelpPage";
import faviconUrl from "./assets/favicon.ico";
import "./styles/globals.css";
import { I18nProvider } from "./i18n";
import { getCadManifestSnapshot, subscribeCadManifest } from "./workbench/cadManifestStore.js";

const ROOT_ID = "root";
const ROOT_CACHE_KEY = "__cadViewerRoot";

function ensureFavicon() {
  if (typeof document === "undefined") {
    return;
  }

  let icon = document.querySelector('link[rel="icon"]');
  if (!icon) {
    icon = document.createElement("link");
    icon.rel = "icon";
    document.head.appendChild(icon);
  }
  icon.type = "image/x-icon";
  icon.href = `${faviconUrl}?v=planetary-gear-workbench`;
}

function bootstrap() {
  const rootElement = document.getElementById(ROOT_ID);
  if (!rootElement) {
    throw new Error(`Missing #${ROOT_ID} mount point.`);
  }
  ensureFavicon();
  document.title = "COSMO AI CAD";
  const cachedRoot = globalThis[ROOT_CACHE_KEY];
  const root = cachedRoot?.element === rootElement && cachedRoot?.root
    ? cachedRoot.root
    : createRoot(rootElement);
  globalThis[ROOT_CACHE_KEY] = {
    element: rootElement,
    root
  };
  root.render(
    <StrictMode>
      <I18nProvider>
        <AppRoot />
      </I18nProvider>
    </StrictMode>,
  );
}

function AppRoot() {
  const [route, setRoute] = useState(() => window.location.hash || "");
  const { manifest, generationStatus, revision, catalogHydrated, catalogRefreshing, catalogError, activeDir } = useSyncExternalStore(
    subscribeCadManifest,
    getCadManifestSnapshot,
    getCadManifestSnapshot,
  );

  useEffect(() => {
    const onHashChange = () => setRoute(window.location.hash || "");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  if (route.startsWith("#/help")) {
    return (
      <HelpPage
        onBack={() => {
          window.location.hash = "";
        }}
      />
    );
  }

  return (
    <CadWorkspace
      manifestRevision={revision}
      manifestEntries={manifest.entries}
      generationStatus={generationStatus}
      catalogHydrated={catalogHydrated}
      catalogRefreshing={catalogRefreshing}
      catalogError={catalogError}
      activeDir={activeDir}
    />
  );
}

bootstrap();
