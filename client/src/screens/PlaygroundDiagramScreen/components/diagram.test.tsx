import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReactFlow } from '@xyflow/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { mockReactFlow } from '../../../test/mockReactFlow';
import DiagramNode, { type DiagramFlowNode } from './DiagramNode';
import { FlowDiagram } from './FlowDiagram';
import type { DiagramConfig } from '../diagram.types';

beforeAll(() => {
  mockReactFlow();
});

const renderNode = (node: Partial<DiagramFlowNode> & { type?: string }) =>
  render(
    <div style={{ width: 800, height: 600 }}>
      <ReactFlow
        nodes={[{ id: 'n', position: { x: 0, y: 0 }, data: { label: 'Express API' }, ...node } as DiagramFlowNode]}
        edges={[]}
        nodeTypes={{ backend: DiagramNode, default: DiagramNode, mystery: DiagramNode }}
      />
    </div>,
  );

const pill = () => screen.getByText('Express API').closest('.diagram-node') as HTMLElement;

describe('DiagramNode', () => {
  it('renders the label and its type as data-type', () => {
    renderNode({ type: 'backend' });
    expect(screen.getByText('Express API')).toBeInTheDocument();
    expect(pill()).toHaveAttribute('data-type', 'backend');
  });

  it('falls back to the default variant for unknown or missing types', () => {
    renderNode({ type: 'mystery' as DiagramFlowNode['type'] });
    expect(pill()).toHaveAttribute('data-type', 'default');
  });

  it('reflects selection in data-selected', () => {
    renderNode({ type: 'backend', selected: true });
    expect(pill()).toHaveAttribute('data-selected', 'true');
  });

  it('is unselected by default', () => {
    renderNode({ type: 'backend' });
    expect(pill()).toHaveAttribute('data-selected', 'false');
  });
});

const config: DiagramConfig = {
  nodes: [
    { id: 'spa', type: 'frontend', position: { x: 0, y: 0 }, data: { label: 'React SPA', description: 'The browser app.' } },
    { id: 'api', type: 'backend', position: { x: 0, y: 130 }, data: { label: 'Express API' } },
    { id: 'misc', position: { x: 200, y: 130 }, data: { label: 'Misc' } },
  ],
  edges: [{ id: 'e1', source: 'spa', target: 'api', label: 'HTTP', curvature: 0.4 }],
};

const renderDiagram = () =>
  render(
    <div style={{ width: 800, height: 600 }}>
      <FlowDiagram config={config} edgeColor="rgb(1, 2, 3)" />
    </div>,
  );

describe('FlowDiagram', () => {
  it('renders a node for every config entry', () => {
    const { container } = renderDiagram();
    expect(container.querySelectorAll('.diagram-node')).toHaveLength(config.nodes.length);
    expect(screen.getByText('React SPA')).toBeInTheDocument();
    expect(screen.getByText('Misc').closest('.diagram-node')).toHaveAttribute('data-type', 'default');
  });

  it('opens the detail panel with the description when a node is clicked', () => {
    const { container } = renderDiagram();
    fireEvent.click(screen.getByText('React SPA'));
    const panel = screen.getByRole('dialog', { name: 'React SPA details' });
    expect(panel).toHaveTextContent('The browser app.');
    expect(container.querySelector('.react-flow__node[data-id="spa"] .diagram-node')).toHaveAttribute('data-selected', 'true');
  });

  // jsdom can't measure handles, so React Flow draws no edges here; edge
  // highlighting is covered in the browser instead.
  it('dims nodes that are not connected to the selected node', () => {
    const { container } = renderDiagram();
    fireEvent.click(screen.getByText('React SPA'));
    expect(container.querySelector('.react-flow__node[data-id="misc"]')).toHaveClass('is-dimmed');
    expect(container.querySelector('.react-flow__node[data-id="api"]')).not.toHaveClass('is-dimmed');
  });

  it('closes the panel from the close button', async () => {
    renderDiagram();
    fireEvent.click(screen.getByText('React SPA'));
    fireEvent.click(screen.getByRole('button', { name: 'Close details' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes the panel when the pane is clicked', async () => {
    const { container } = renderDiagram();
    fireEvent.click(screen.getByText('React SPA'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(container.querySelector('.react-flow__pane') as Element);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('omits the description when a node has none', () => {
    renderDiagram();
    fireEvent.click(screen.getByText('Express API'));
    const panel = screen.getByRole('dialog', { name: 'Express API details' });
    expect(panel.querySelector('p')).toBeNull();
  });
});
