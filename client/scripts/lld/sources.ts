import path from "node:path";
import type { LldSource } from "./buildDiagram";

/** Codebases turned into low-level diagrams. Keys become `?diagram=<key>`. */
export function lldSources(clientDir: string): Record<string, LldSource> {
  return {
    "lld-server": {
      title: "Server low-level design",
      root: path.resolve(clientDir, "../server/src"),
      displayRoot: "server/src",
      layers: {
        routes: "frontend",
        socket: "frontend",
        middlewares: "backend",
        controllers: "backend",
        services: "backend",
        games: "backend",
        repositories: "data",
        models: "data",
        config: "external",
      },
    },
    "lld-client": {
      title: "Client low-level design",
      root: path.resolve(clientDir, "src"),
      displayRoot: "client/src",
      aliases: { "@/": "" },
      exclude: [/^main\.tsx$/],
      layers: {
        screens: "frontend",
        components: "frontend",
        hooks: "backend",
        store: "data",
        api: "external",
      },
    },
  };
}
