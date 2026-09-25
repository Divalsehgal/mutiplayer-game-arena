import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HowItsBuiltWidget } from './HowItsBuiltWidget';

vi.mock('../../PlaygroundDiagramScreen/ArchitecturePreview', () => ({
  default: ({ diagramKey }: { diagramKey: string }) => (
    <div data-testid="architecture-preview" data-diagram={diagramKey} />
  ),
}));

const renderWidget = () =>
  render(
    <MemoryRouter>
      <HowItsBuiltWidget />
    </MemoryRouter>,
  );

const openDialog = async () => {
  fireEvent.click(screen.getByRole('button', { name: /how it's built/i }));
  return screen.findByRole('dialog', { name: 'How Game Arena is built' });
};

describe('HowItsBuiltWidget', () => {
  it('shows only the trigger until clicked', () => {
    renderWidget();
    expect(screen.getByRole('button', { name: /how it's built/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a dialog with the diagram and a link to the full view', async () => {
    renderWidget();
    await openDialog();
    expect(await screen.findByTestId('architecture-preview')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /full view/i })).toHaveAttribute('href', '/playground/diagram?diagram=architecture');
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('switches to the low-level diagrams from the tabs', async () => {
    renderWidget();
    await openDialog();
    fireEvent.click(screen.getByRole('tab', { name: 'Server LLD' }));
    expect(await screen.findByTestId('architecture-preview')).toHaveAttribute('data-diagram', 'lld-server');
    expect(screen.getByRole('tab', { name: 'Server LLD' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('link', { name: /full view/i })).toHaveAttribute('href', '/playground/diagram?diagram=lld-server');
  });

  it('closes from the close button and returns focus to the trigger', async () => {
    renderWidget();
    await openDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: /how it's built/i })).toHaveFocus();
  });

  it('closes on Escape', async () => {
    renderWidget();
    await openDialog();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes when the backdrop is clicked but not when the dialog is', async () => {
    renderWidget();
    const dialog = await openDialog();
    fireEvent.click(dialog);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(dialog.parentElement as HTMLElement);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
