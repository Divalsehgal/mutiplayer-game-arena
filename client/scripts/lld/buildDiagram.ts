import fs from "node:fs";
import path from "node:path";
import type { LldDiagram, LldEdge, LldNode, LldNodeType } from "./types";
import { parseModule, type ParsedModule } from "./parseModule";

const ROW_HEIGHT = 140;
const MAX_PER_ROW = 7;
const HALF = 0.5;
// Rough pill width: ~7px per label character plus icon and padding.
const CHAR_WIDTH = 7;
const PILL_CHROME = 56;
const COLUMN_GAP = 36;
const LABEL_SEGMENTS = 2;
const SOURCE_EXT = /\.tsx?$/;
const DEFAULT_EXCLUDE = [/\.test\.tsx?$/, /(^|\/)test\.tsx?$/, /(^|\/)test\//, /\.d\.ts$/];

export interface LldSource {
  title: string;
  /** Absolute directory to scan. */
  root: string;
  /** How the root is shown to readers, e.g. "server/src". */
  displayRoot: string;
  /** Import prefixes that map to `root`, e.g. { "@/": "" }. */
  aliases?: Record<string, string>;
  exclude?: RegExp[];
  /** Maps a module's top-level folder to its visual node type. */
  layers: Record<string, LldNodeType>;
}

function listFiles(dir: string, root: string, exclude: RegExp[]): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full, root, exclude);
    const rel = path.relative(root, full).split(path.sep).join("/");
    return SOURCE_EXT.test(rel) && !exclude.some((re) => re.test(rel)) ? [rel] : [];
  });
}

const moduleId = (rel: string) => rel.replace(SOURCE_EXT, "");
/** Last two path segments; the full path is in the node's description. */
const moduleLabel = (id: string) =>
  id.replace(/\/index$/, "").split("/").slice(-LABEL_SEGMENTS).join("/");
const pillWidth = (id: string) => moduleLabel(id).length * CHAR_WIDTH + PILL_CHROME;

function resolveImport(spec: string, fromRel: string, source: LldSource, known: Set<string>) {
  let base: string | undefined;
  if (spec.startsWith(".")) {
    base = path.posix.join(path.posix.dirname(fromRel), spec);
  } else {
    const alias = Object.keys(source.aliases ?? {}).find((prefix) => spec.startsWith(prefix));
    if (alias) base = path.posix.join(source.aliases?.[alias] ?? "", spec.slice(alias.length));
  }
  if (base === undefined) return undefined;
  const stem = base.replace(/\.js$/, "");
  return [stem, `${stem}/index`].find((candidate) => known.has(candidate));
}

/** Rank = longest chain of importers above a module, so imports point downwards. */
function rankModules(ids: string[], importers: Map<string, Set<string>>) {
  const rank = new Map<string, number>();
  const visiting = new Set<string>();
  const visit = (id: string): number => {
    const cached = rank.get(id);
    if (cached !== undefined) return cached;
    if (visiting.has(id)) return 0; // cycle: ignore the back edge
    visiting.add(id);
    const parents = [...(importers.get(id) ?? [])];
    const value = parents.length ? Math.max(...parents.map(visit)) + 1 : 0;
    visiting.delete(id);
    rank.set(id, value);
    return value;
  };
  ids.forEach(visit);
  return rank;
}

export function buildLldDiagram(source: LldSource): LldDiagram {
  const files = listFiles(source.root, source.root, [...DEFAULT_EXCLUDE, ...(source.exclude ?? [])]);
  const parsed = new Map<string, ParsedModule & { rel: string }>();
  for (const rel of files) {
    const text = fs.readFileSync(path.join(source.root, rel), "utf8");
    parsed.set(moduleId(rel), { rel, ...parseModule(rel, text) });
  }
  const known = new Set(parsed.keys());

  const edges: LldEdge[] = [];
  const importers = new Map<string, Set<string>>();
  for (const [id, mod] of parsed) {
    const targets = new Set(
      mod.imports
        .map((spec) => resolveImport(spec, mod.rel, source, known))
        .filter((target): target is string => !!target && target !== id),
    );
    for (const target of targets) {
      edges.push({ id: `${id}->${target}`, source: id, target });
      if (!importers.has(target)) importers.set(target, new Set());
      importers.get(target)?.add(id);
    }
  }

  const ids = [...parsed.keys()];
  const rank = rankModules(ids, importers);
  const layerOf = (id: string) => (id.includes("/") ? id.split("/")[0] : "");
  const byRank = new Map<number, string[]>();
  for (const id of ids) {
    const r = rank.get(id) ?? 0;
    byRank.set(r, [...(byRank.get(r) ?? []), id]);
  }

  const nodes: LldNode[] = [];
  let row = 0;
  for (const r of [...byRank.keys()].sort((a, b) => a - b)) {
    const group = (byRank.get(r) ?? []).sort(
      (a, b) => layerOf(a).localeCompare(layerOf(b)) || a.localeCompare(b),
    );
    for (let start = 0; start < group.length; start += MAX_PER_ROW, row += 1) {
      const chunk = group.slice(start, start + MAX_PER_ROW);
      const widths = chunk.map(pillWidth);
      const rowWidth = widths.reduce((sum, w) => sum + w, 0) + COLUMN_GAP * (chunk.length - 1);
      let cursor = -rowWidth * HALF;
      chunk.forEach((id, index) => {
        const centerX = cursor + widths[index] * HALF;
        cursor += widths[index] + COLUMN_GAP;
        const mod = parsed.get(id);
        if (!mod) return;
        const usedBy = importers.get(id)?.size ?? 0;
        const importsCount = edges.filter((edge) => edge.source === id).length;
        nodes.push({
          id,
          type: source.layers[layerOf(id)],
          position: {
            x: Math.round(centerX),
            y: row * ROW_HEIGHT,
          },
          data: {
            label: moduleLabel(id),
            description: `${source.displayRoot}/${mod.rel} · ${mod.lines} lines · imports ${importsCount} · used by ${usedBy}`,
            members: mod.members,
          },
        });
      });
    }
  }

  const memberCount = nodes.reduce((sum, node) => sum + (node.data.members?.length ?? 0), 0);
  return {
    title: source.title,
    subtitle: nodes.length
      ? `Generated from ${source.displayRoot}: ${nodes.length} modules, ${memberCount} exports and events, ${edges.length} imports. Updates automatically when files change.`
      : `No source files found in ${source.displayRoot}.`,
    nodes,
    edges,
  };
}
