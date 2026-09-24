import React from 'react';
import { 
  X, 
  Trash2, 
  FolderOpen, 
  Calendar, 
  Layers, 
  ArrowUpRight 
} from 'lucide-react';
import type { SavedQuotation } from '../types/calculator';
import { formatUSD, formatBOB } from '../utils/formatters';

interface SavedQuotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedQuotes: SavedQuotation[];
  onLoadQuote: (quote: SavedQuotation) => void;
  onDeleteQuote: (id: string) => void;
}

export const SavedQuotesModal: React.FC<SavedQuotesModalProps> = ({
  isOpen,
  onClose,
  savedQuotes,
  onLoadQuote,
  onDeleteQuote
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Layers className="modal-title-icon" size={20} />
            <div>
              <h3>Historial de Cotizaciones Guardadas</h3>
              <p>Carga cálculos previos de importación o descarta simulaciones antiguas.</p>
            </div>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {savedQuotes.length === 0 ? (
            <div className="modal-empty-state">
              <FolderOpen size={48} className="empty-icon text-muted" />
              <p>No tienes cotizaciones guardadas aún.</p>
              <span>Usa el botón "Guardar" en la barra superior para almacenar la cotización actual.</span>
            </div>
          ) : (
            <div className="quotes-list">
              {savedQuotes.map((quote) => (
                <div key={quote.id} className="quote-item-card">
                  <div className="quote-item-info">
                    <div className="quote-title-row">
                      <h4>{quote.title}</h4>
                      <span className="quote-date">
                        <Calendar size={12} />
                        {quote.date}
                      </span>
                    </div>
                    <div className="quote-details-row">
                      <span>{quote.products.length} productos</span>
                      <span>•</span>
                      <span>Tipo de Cambio: {quote.customsConfig.exchangeRate} Bs.</span>
                      <span>•</span>
                      <strong className="text-emerald">
                        Total: {formatUSD(quote.totalLandedUSD)} ({formatBOB(quote.totalLandedBOB)})
                      </strong>
                    </div>
                  </div>

                  <div className="quote-actions">
                    <button
                      type="button"
                      className="load-quote-btn"
                      onClick={() => {
                        onLoadQuote(quote);
                        onClose();
                      }}
                    >
                      <ArrowUpRight size={15} />
                      Cargar
                    </button>
                    <button
                      type="button"
                      className="delete-quote-btn"
                      onClick={() => onDeleteQuote(quote.id)}
                      title="Eliminar del historial"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="action-btn secondary-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
