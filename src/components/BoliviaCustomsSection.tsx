import React from 'react';
import { 
  Building2, 
  Truck, 
  Percent, 
  Receipt
} from 'lucide-react';
import type { BoliviaCustomsConfig, CalculationSummary } from '../types/calculator';
import { formatUSD, formatBOB } from '../utils/formatters';
import { NumericInput } from './NumericInput';

interface BoliviaCustomsSectionProps {
  customsConfig: BoliviaCustomsConfig;
  summary: CalculationSummary;
  exchangeRate: number;
  onUpdateCustoms: (updates: Partial<BoliviaCustomsConfig>) => void;
}

export const BoliviaCustomsSection: React.FC<BoliviaCustomsSectionProps> = ({
  customsConfig,
  summary,
  exchangeRate,
  onUpdateCustoms
}) => {
  const dhlUSD = customsConfig.dhlHandlingFeeUSD ?? 40.0;
  const dhlBOB = dhlUSD * exchangeRate;

  return (
    <div className="section-card customs-card">
      <div className="section-card-header">
        <div className="section-title-wrap">
          <div className="section-icon-badge customs-badge">
            <Building2 size={20} />
          </div>
          <div>
            <div className="customs-title-row">
              <h2 className="section-title">3. Liquidación Aduanera & Manejo DHL Bolivia</h2>
              <span className="customs-tag">Aduana Nacional de Bolivia (ANB)</span>
            </div>
            <p className="section-subtitle">
              Cálculo de la Base Imponible CIF Frontera, Gravamen Arancelario, IVA Efectivo (14.94%) y Tasa fija DHL ($40 USD).
            </p>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Formula */}
      <div className="customs-pipeline-box">
        <span className="pipeline-title">Fórmula Legal Base Imponible Aduanera:</span>
        <div className="pipeline-flow">
          <div className="pipeline-node">
            <span className="node-lbl">1. Compra eBay (FOB)</span>
            <span className="node-val">{formatUSD(summary.totalFobUSD)}</span>
          </div>
          <span className="pipeline-operator">+</span>
          <div className="pipeline-node">
            <span className="node-lbl">2. Courier MyUS</span>
            <span className="node-val">{formatUSD(summary.totalMyUSUSD)}</span>
          </div>
          <span className="pipeline-operator">=</span>
          <div className="pipeline-node highlight-node">
            <span className="node-lbl">Base Imponible CIF Bolivia</span>
            <span className="node-val">{formatUSD(summary.cifBaseUSD)}</span>
            <span className="node-sub">({formatBOB(summary.cifBaseUSD * exchangeRate)})</span>
          </div>
        </div>
      </div>

      <div className="customs-cards-grid">
        {/* GA (Gravamen Arancelario) */}
        <div className="customs-metric-card">
          <div className="customs-card-top">
            <div className="metric-title-group">
              <Percent size={18} className="metric-icon ga-icon" />
              <div>
                <h4>Gravamen Arancelario (GA)</h4>
                <p>Alícuota arancelaria sobre CIF según partida</p>
              </div>
            </div>
            <span className="tax-badge">Tributo Aduanero</span>
          </div>
          
          <div className="metric-amount-row">
            <div className="main-metric-val">{formatUSD(summary.totalGaUSD)}</div>
            <div className="sub-metric-val">{formatBOB(summary.totalGaUSD * exchangeRate)}</div>
          </div>

          <div className="metric-note">
            <span>
              {summary.totalGaUSD === 0 
                ? '✓ Tecnología y Electrónica exentas de GA (0%).' 
                : 'Prorrateado por partida arancelaria.'}
            </span>
          </div>
        </div>

        {/* IVA Importación Bolivia (14.94%) */}
        <div className="customs-metric-card highlight-card">
          <div className="customs-card-top">
            <div className="metric-title-group">
              <Receipt size={18} className="metric-icon iva-icon" />
              <div>
                <h4>IVA Efectivo de Importación</h4>
                <p>14.94% aplicado sobre (Base CIF + GA)</p>
              </div>
            </div>
            <span className="tax-badge legal-badge">14.94% Fijo</span>
          </div>

          <div className="metric-amount-row">
            <div className="main-metric-val">{formatUSD(summary.totalIvaUSD)}</div>
            <div className="sub-metric-val">{formatBOB(summary.totalIvaUSD * exchangeRate)}</div>
          </div>

          <div className="metric-note">
            <span>Base imponible tributaria: {formatUSD(summary.cifBaseUSD + summary.totalGaUSD)}</span>
          </div>
        </div>

        {/* Manejo DHL ($40 USD) */}
        <div className="customs-metric-card dhl-card">
          <div className="customs-card-top">
            <div className="metric-title-group">
              <Truck size={18} className="metric-icon dhl-icon" />
              <div>
                <h4>Tasa de Manejo DHL Bolivia</h4>
                <p>Desaduanamiento y entrega local de courier</p>
              </div>
            </div>
            <span className="dhl-badge">Courier Fee</span>
          </div>

          <div className="dhl-input-row">
            <div className="input-with-currency large-input">
              <span className="currency-symbol">$</span>
              <NumericInput
                min={0}
                fallbackOnBlur={0}
                allowDecimals={true}
                value={customsConfig.dhlHandlingFeeUSD}
                onValueChange={(val) => onUpdateCustoms({ dhlHandlingFeeUSD: val })}
                className="table-input"
                placeholder="40"
              />
              <span className="input-unit">USD</span>
            </div>
            <div className="dhl-bob-equivalent">
              ≈ <strong>{formatBOB(dhlBOB)}</strong>
            </div>
          </div>

          <div className="metric-note">
            <span>Tasa fija estándar cobrada por DHL en Bolivia por trámite de aduana.</span>
          </div>
        </div>
      </div>

      {/* Resumen de Tributos & Cargos Locales */}
      <div className="customs-summary-strip">
        <div className="customs-summary-left">
          <div className="tax-breakdown-item">
            <span className="tax-item-label">Total Impuestos Aduana (GA + IVA):</span>
            <strong className="tax-item-val">{formatUSD(summary.totalCustomsTaxesUSD)} ({formatBOB(summary.totalCustomsTaxesUSD * exchangeRate)})</strong>
          </div>
          <span className="separator">•</span>
          <div className="tax-breakdown-item">
            <span className="tax-item-label">Manejo DHL:</span>
            <strong className="tax-item-val">{formatUSD(dhlUSD)} ({formatBOB(dhlBOB)})</strong>
          </div>
        </div>

        <div className="customs-summary-right">
          <span className="customs-total-label">Total Liquidación Bolivia:</span>
          <div className="customs-grand-total">
            <span className="total-usd">{formatUSD(summary.totalCustomsTaxesUSD + dhlUSD)}</span>
            <span className="total-bob">({formatBOB((summary.totalCustomsTaxesUSD + dhlUSD) * exchangeRate)})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
