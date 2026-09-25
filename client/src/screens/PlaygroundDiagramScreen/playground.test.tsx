import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import PlaygroundDiagramScreen from '.';
import { DIAGRAMS, getDiagram } from './diagram.config';
import { EDGE_COLORS } from './diagramTheme';
import type { DiagramConfig } from './diagram.types';

vi.mock('./components/FlowDiagram', () => ({
  FlowDiagram: ({ config, edgeColor }: { config: DiagramConfig; edgeColor: string }) => (
    <div data-testid="flow-diagram" data-edge-color={edgeColor}>
      {config.nodes.length} nodes
    </div>
  ),
}));

const renderAt = (path = '/playground/diagram', config?: DiagramConfig) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <PlaygroundDiagramScreen config={config} />
    </MemoryRouter>,
  );

describe('PlaygroundDiagramScreen', () => {
  it('renders the default diagram title, subtitle and canvas', () => {
    renderAt();
    const diagram = DIAGRAMS.architecture;
    expect(screen.getByRole('heading', { name: diagram.title })).toBeInTheDocument();
    expect(screen.getByText(diagram.subtitle as string)).toBeInTheDocument();
    expect(screen.getByTestId('flow-diagram')).toHaveTextContent(`${diagram.nodes.length} nodes`);
    expect(document.title).toBe(`${diagram.title} · Game Arena`);
  });

  it('selects a diagram with ?diagram=<key>', () => {
    renderAt('/playground/diagram?diagram=move-lifecycle');
    expect(screen.getByRole('heading', { name: DIAGRAMS['move-lifecycle'].title })).toBeInTheDocument();
  });

  it('lists the generated low-level diagrams as tabs and switches between them', () => {
    renderAt();
    expect(screen.getByRole('tab', { name: 'Architecture' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(screen.getByRole('tab', { name: 'Server LLD' }));
    expect(screen.getByRole('heading', { name: 'Server low-level design' })).toBeInTheDocument();
    expect(screen.getByTestId('flow-diagram')).toHaveTextContent(`${DIAGRAMS['lld-server'].nodes.length} nodes`);
  });

  it('renders an empty state instead of the canvas when there are no nodes', () => {
    renderAt(undefined, { title: 'Empty', nodes: [], edges: [] });
    expect(screen.getByText('Nothing to show yet')).toBeInTheDocument();
    expect(screen.queryByTestId('flow-diagram')).not.toBeInTheDocument();
  });

  it('toggles the theme and passes the matching edge colour', () => {
    const { container } = renderAt();
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('data-theme', 'dark');
    expect(screen.getByTestId('flow-diagram')).toHaveAttribute('data-edge-color', EDGE_COLORS.dark.edge);

    fireEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }));
    expect(root).toHaveAttribute('data-theme', 'light');
    expect(screen.getByTestId('flow-diagram')).toHaveAttribute('data-edge-color', EDGE_COLORS.light.edge);
  });
});

describe('getDiagram', () => {
  it('falls back to the default diagram for missing or unknown keys', () => {
    expect(getDiagram(null)).toBe(DIAGRAMS.architecture);
    expect(getDiagram('nope')).toBe(DIAGRAMS.architecture);
    expect(getDiagram('toString')).toBe(DIAGRAMS.architecture);
  });

  it('only references node ids that exist in each config', () => {
    for (const diagram of Object.values(DIAGRAMS)) {
      const ids = new Set(diagram.nodes.map((node) => node.id));
      for (const edge of diagram.edges) {
        expect(ids.has(edge.source) && ids.has(edge.target)).toBe(true);
      }
    }
  });
});
