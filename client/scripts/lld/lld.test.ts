import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { parseModule } from './parseModule';
import { buildLldDiagram, type LldSource } from './buildDiagram';
import { lldSources } from './sources';

describe('parseModule', () => {
  it('collects exports, class methods, routes, socket events and runtime imports', () => {
    const { imports, members } = parseModule('room.ts', `
      import type { Foo } from './types';
      import { helper } from './helper';
      export { util } from './util';
      export function createRoom(name: string): Room { return helper(name); }
      export const useRooms = () => [];
      export const LIMIT = 4;
      export class RoomController {
        join(id: string) {}
        private secret() {}
      }
      function internal() {}
      router.post('/rooms', handler);
      socket.on('join-room', () => socket.emit('room-updated'));
      const Lazy = lazy(() => import('./Lazy'));
    `);

    expect(imports).toEqual(['./helper', './util', './Lazy']);
    expect(members).toEqual(expect.arrayContaining([
      { kind: 'function', name: 'createRoom', signature: '(name: string): Room' },
      { kind: 'hook', name: 'useRooms', signature: '()' },
      { kind: 'const', name: 'LIMIT' },
      { kind: 'class', name: 'RoomController' },
      { kind: 'method', name: 'RoomController.join', signature: '(id: string)' },
      { kind: 'route', name: 'POST /rooms' },
      { kind: 'listens', name: 'join-room' },
      { kind: 'emits', name: 'room-updated' },
    ]));
    const names = members.map((m) => m.name);
    expect(names).not.toContain('internal');
    expect(names).not.toContain('RoomController.secret');
  });

  it('marks PascalCase functions in .tsx files as components', () => {
    const { members } = parseModule('Card.tsx', 'export default function Card() { return null; }');
    expect(members[0]).toMatchObject({ kind: 'component', name: 'Card' });
  });
});

describe('buildLldDiagram', () => {
  let root: string;
  const write = (rel: string, text: string) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  const source = (): LldSource => ({
    title: 'Test',
    root,
    displayRoot: 'src',
    aliases: { '@/': '' },
    layers: { routes: 'frontend', services: 'backend', models: 'data' },
  });

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'lld-'));
    write('routes/room.ts', "import { svc } from '../services/room';\nimport '@/models/room';");
    write('services/room/index.ts', "import { Room } from '../../models/room';\nexport const svc = 1;");
    write('models/room.ts', 'export class Room {}');
    write('services/room/index.test.ts', "import '../../models/room';");
  });
  afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

  it('creates a node per module and an edge per import, skipping tests', () => {
    const diagram = buildLldDiagram(source());
    expect(diagram.nodes.map((n) => n.id).sort()).toEqual(['models/room', 'routes/room', 'services/room/index']);
    expect(diagram.edges.map((e) => e.id).sort()).toEqual([
      'routes/room->models/room',
      'routes/room->services/room/index',
      'services/room/index->models/room',
    ]);
    const service = diagram.nodes.find((n) => n.id === 'services/room/index');
    expect(service).toMatchObject({ type: 'backend', data: { label: 'services/room' } });
    expect(diagram.nodes.find((n) => n.id === 'routes/room')?.data.description).toBe('src/routes/room.ts · 2 lines · imports 2 · used by 0');
  });

  it('places importers above the modules they import', () => {
    const y = Object.fromEntries(buildLldDiagram(source()).nodes.map((n) => [n.id, n.position.y]));
    expect(y['routes/room']).toBeLessThan(y['services/room/index']);
    expect(y['services/room/index']).toBeLessThan(y['models/room']);
  });

  it('picks up newly added files and functions on the next build', () => {
    write('services/user.ts', "import { Room } from '../models/room';\nexport function getUser(id: string) {}");
    const diagram = buildLldDiagram(source());
    const user = diagram.nodes.find((n) => n.id === 'services/user');
    expect(user?.data.members).toEqual([{ kind: 'function', name: 'getUser', signature: '(id: string)' }]);
    expect(diagram.edges.some((e) => e.id === 'services/user->models/room')).toBe(true);
  });

  it('returns an empty diagram when the folder does not exist', () => {
    const diagram = buildLldDiagram({ ...source(), root: path.join(root, 'missing') });
    expect(diagram.nodes).toEqual([]);
  });
});

describe('real codebase', () => {
  it('generates connected diagrams for the server and client', () => {
    for (const src of Object.values(lldSources(path.resolve(__dirname, '../..')))) {
      const diagram = buildLldDiagram(src);
      const ids = new Set(diagram.nodes.map((n) => n.id));
      expect(diagram.nodes.length).toBeGreaterThan(10);
      expect(diagram.edges.every((e) => ids.has(e.source) && ids.has(e.target))).toBe(true);

      // Pills in the same row must not overlap (7px/char + 56px chrome estimate).
      const rows = new Map<number, typeof diagram.nodes>();
      for (const node of diagram.nodes) rows.set(node.position.y, [...(rows.get(node.position.y) ?? []), node]);
      for (const row of rows.values()) {
        const sorted = [...row].sort((a, b) => a.position.x - b.position.x);
        for (let i = 1; i < sorted.length; i++) {
          const half = (n: (typeof sorted)[number]) => (n.data.label.length * 7 + 56) / 2;
          expect(sorted[i].position.x - sorted[i - 1].position.x).toBeGreaterThanOrEqual(half(sorted[i]) + half(sorted[i - 1]));
        }
      }
    }
  });
});
