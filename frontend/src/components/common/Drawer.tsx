import { ReactNode, useEffect } from 'react';
import './drawer.css';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  widthPx?: number;
}

/**
 * Painel lateral usado no lugar de navegar pra uma tela nova, quando
 * a ação é rápida e a pessoa não deveria perder o contexto de onde
 * estava (ex.: cadastrar um paciente sem sair da lista, ver detalhe
 * de uma consulta sem sair da agenda). Ver uso em pages/Patients.
 *
 * Fecha com Esc, clique no backdrop, ou no botão de fechar — sempre
 * chamando onClose(), quem controla o estado "aberto/fechado" é o
 * componente pai (geralmente refletido na URL via query param, pra
 * sobreviver a um refresh).
 */
export function Drawer({ open, onClose, title, children, footer, widthPx = 420 }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="drawer-panel"
        style={{ width: widthPx }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-header">
          <h3>{title}</h3>
          <button className="drawer-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-footer">{footer}</div>}
      </aside>
    </div>
  );
}
