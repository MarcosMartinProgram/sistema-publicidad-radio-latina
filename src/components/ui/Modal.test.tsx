import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "@/components/ui/Modal";

describe("Modal", () => {
  it("no se monta cuando open=false", () => {
    render(<Modal open={false} onClose={() => {}} title="Hola">contenido</Modal>);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText("contenido")).toBeNull();
  });

  it("renderiza título, contenido y footer cuando open=true", () => {
    render(
      <Modal
        open
        onClose={() => {}}
        title="Editar cliente"
        footer={<button>Guardar</button>}
      >
        <p>body</p>
      </Modal>
    );
    expect(screen.getByText("Editar cliente")).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /guardar/i })).toBeInTheDocument();
  });

  it("llama onClose al clickear el botón cerrar", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="X">
        contenido
      </Modal>
    );
    await userEvent.click(screen.getByRole("button", { name: /cerrar/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("cierra con tecla Escape", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="X">
        contenido
      </Modal>
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("cierra al clickear el backdrop", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="X">
        contenido
      </Modal>
    );
    const backdrop = document.body.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it("bloquea el scroll del body mientras está abierto y lo restaura al cerrar", () => {
    const { rerender } = render(
      <Modal open onClose={() => {}} title="X">
        contenido
      </Modal>
    );
    expect(document.body.style.overflow).toBe("hidden");
    rerender(
      <Modal open={false} onClose={() => {}} title="X">
        contenido
      </Modal>
    );
    expect(document.body.style.overflow).toBe("");
  });
});
