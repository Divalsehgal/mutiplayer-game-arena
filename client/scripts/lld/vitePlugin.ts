import path from "node:path";
import type { Plugin } from "vite";
import { buildLldDiagram, type LldSource } from "./buildDiagram";

const VIRTUAL_ID = "virtual:lld-diagrams";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
const DEBOUNCE_MS = 150;
const WATCHED = /\.tsx?$/;

/**
 * Serves `virtual:lld-diagrams`: low-level diagrams generated from source on
 * every dev-server start and build. In dev it watches the source folders and
 * hot-reloads the diagrams when a module's exports, events or imports change.
 */
export function lldDiagrams(sources: Record<string, LldSource>): Plugin {
  let output: string | undefined;
  const generate = () => {
    const diagrams = Object.fromEntries(
      Object.entries(sources).map(([key, source]) => [key, buildLldDiagram(source)]),
    );
    return `export default ${JSON.stringify(diagrams)};`;
  };
  const roots = Object.values(sources).map((source) => source.root + path.sep);

  return {
    name: "lld-diagrams",
    resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : undefined),
    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      output ??= generate();
      return output;
    },
    configureServer(server) {
      server.watcher.add(roots);
      let timer: ReturnType<typeof setTimeout> | undefined;
      const onFileEvent = (file: string) => {
        if (!WATCHED.test(file) || !roots.some((root) => file.startsWith(root))) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          const next = generate();
          if (next === output) return; // body-only edits don't change the diagram
          output = next;
          const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
          if (mod) void server.reloadModule(mod);
        }, DEBOUNCE_MS);
      };
      server.watcher.on("add", onFileEvent);
      server.watcher.on("unlink", onFileEvent);
      server.watcher.on("change", onFileEvent);
    },
  };
}
