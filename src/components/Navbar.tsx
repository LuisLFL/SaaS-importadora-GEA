import React from 'react';
import { 
  Plane, 
  RotateCcw, 
  Sparkles, 
  Printer, 
  BookmarkCheck, 
  Coins, 
  Layers
} from 'lucide-react';

interface NavbarProps {
  currencyMode: 'both' | 'usd' | 'bob';
  onCurrencyModeChange: (mode: 'both' | 'usd' | 'bob') => void;
  onLoadSample: () => void;
  onReset: () => void;
  onSaveQuote: () => void;
  onOpenSavedModal: () => void;
  savedQuotesCount: number;
  onPrint: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currencyMode,
  onCurrencyModeChange,
  onLoadSample,
  onReset,
  onSaveQuote,
  onOpenSavedModal,
  savedQuotesCount,
  onPrint
}) => {
  return (
    <header className="navbar-container">
      <div className="navbar-content">
        <div className="navbar-brand">
          <div className="brand-logo-badge">
            <Plane className="brand-icon" />
          </div>
          <div className="brand-text-group">
            <div className="brand-title-row">
              <span className="brand-title">GEA Import</span>
              <span className="brand-tag">SaaS v2.4</span>
            </div>
            <p className="brand-subtitle">
              Calculadora de Importación • MyUS Courier & Aduana Bolivia
            </p>
          </div>
        </div>

        <div className="navbar-controls">
          {/* Selector de visualización de divisa */}
          <div className="currency-selector-capsule" title="Formato de visualización de precios">
            <Coins size={15} className="currency-icon-badge" />
            <button
              type="button"
              className={`currency-pill-btn ${currencyMode === 'both' ? 'active' : ''}`}
              onClick={() => onCurrencyModeChange('both')}
            >
              USD & Bs.
            </button>
            <button
              type="button"
              className={`currency-pill-btn ${currencyMode === 'usd' ? 'active' : ''}`}
              onClick={() => onCurrencyModeChange('usd')}
            >
              $ USD
            </button>
            <button
              type="button"
              className={`currency-pill-btn ${currencyMode === 'bob' ? 'active' : ''}`}
              onClick={() => onCurrencyModeChange('bob')}
            >
              Bs. BOB
            </button>
          </div>

          <div className="nav-actions-group">
            <button 
              type="button" 
              className="action-btn secondary-btn"
              onClick={onLoadSample}
              title="Cargar un ejemplo típico de compras de eBay con MyUS y DHL"
            >
              <Sparkles size={16} />
              <span>Ejemplo eBay</span>
            </button>

            <button 
              type="button" 
              className="action-btn secondary-btn"
              onClick={onSaveQuote}
              title="Guardar cálculo actual"
            >
              <BookmarkCheck size={16} />
              <span>Guardar</span>
            </button>

            <button 
              type="button" 
              className="action-btn secondary-btn quote-count-btn"
              onClick={onOpenSavedModal}
              title="Ver cotizaciones guardadas"
            >
              <Layers size={16} />
              <span>Historial</span>
              {savedQuotesCount > 0 && (
                <span className="quote-count-badge">{savedQuotesCount}</span>
              )}
            </button>

            <button 
              type="button" 
              className="action-btn primary-btn print-action-btn"
              onClick={onPrint}
              title="Imprimir reporte o guardar como PDF"
            >
              <Printer size={16} />
              <span>Imprimir / PDF</span>
            </button>

            <button 
              type="button" 
              className="action-btn icon-only-btn danger-hover-btn"
              onClick={onReset}
              title="Reiniciar todos los campos"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
