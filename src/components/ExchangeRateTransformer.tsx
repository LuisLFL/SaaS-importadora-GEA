import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  TrendingUp, 
  DollarSign, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { EXCHANGE_RATE_PRESETS } from '../utils/calculatorEngine';
import { formatBOB } from '../utils/formatters';

interface ExchangeRateTransformerProps {
  exchangeRate: number;
  onExchangeRateChange: (rate: number) => void;
}

export const ExchangeRateTransformer: React.FC<ExchangeRateTransformerProps> = ({
  exchangeRate,
  onExchangeRateChange
}) => {
  const [quickUsd, setQuickUsd] = useState<number>(100);

  return (
    <div className="transformer-card">
      <div className="transformer-header">
        <div className="transformer-title-wrap">
          <div className="transformer-icon-wrap">
            <ArrowLeftRight className="transformer-icon" />
          </div>
          <div>
            <div className="transformer-title-row">
              <h3 className="transformer-title">Transformador de Dólar (USD ⇄ BOB)</h3>
              <span className="live-rate-tag">
                <TrendingUp size={13} />
                Tasa Dinámica Activa
              </span>
            </div>
            <p className="transformer-desc">
              Debido a la volatilidad cambiaria en Bolivia, ajusta la tasa de cambio con la que se liquidará la importación.
            </p>
          </div>
        </div>

        {/* Quick Rate Mini Converter */}
        <div className="mini-converter-box">
          <span className="mini-conv-label">Conversor de referencia rápida:</span>
          <div className="mini-conv-row">
            <div className="mini-conv-input-wrap">
              <span className="input-prefix">$</span>
              <input
                type="number"
                min="0"
                step="10"
                value={quickUsd || ''}
                onChange={(e) => setQuickUsd(parseFloat(e.target.value) || 0)}
                className="mini-conv-input"
              />
              <span className="input-suffix">USD</span>
            </div>
            <span className="conv-arrow">≈</span>
            <div className="mini-conv-result">
              <strong>{formatBOB(quickUsd * exchangeRate)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="transformer-body">
        <div className="rate-input-container">
          <label className="rate-field-label">
            <span>Tipo de Cambio Base</span>
            <span className="rate-formula-hint">(1.00 USD = X Bolivianos)</span>
          </label>
          <div className="rate-input-wrapper">
            <span className="rate-prefix">Bs.</span>
            <input
              type="number"
              step="0.05"
              min="1"
              max="100"
              value={exchangeRate || ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onExchangeRateChange(isNaN(val) ? 0 : val);
              }}
              className="main-rate-input"
              placeholder="Ej. 9.80"
            />
            <span className="rate-suffix">BOB / USD</span>
          </div>
        </div>

        <div className="presets-container">
          <span className="presets-label">
            <DollarSign size={13} />
            Accesos directos a tasas:
          </span>
          <div className="presets-list">
            {EXCHANGE_RATE_PRESETS.map((preset) => {
              const isSelected = Math.abs(exchangeRate - preset.rate) < 0.01;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onExchangeRateChange(preset.rate)}
                  className={`preset-pill ${isSelected ? 'active' : ''}`}
                >
                  {isSelected && <CheckCircle2 size={13} className="preset-check" />}
                  <span className="preset-name">{preset.label}:</span>
                  <span className="preset-val">{preset.rate.toFixed(2)} Bs.</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="transformer-footer">
        <Info size={14} className="info-icon" />
        <span>
          Todos los costos (eBay FOB, flete MyUS, impuestos aduaneros bolivianos e importe DHL de $40 USD) se transformarán automáticamente con esta tasa ({exchangeRate > 0 ? exchangeRate.toFixed(2) : '0.00'} Bs./USD).
        </span>
      </div>
    </div>
  );
};
