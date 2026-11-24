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
  const taxesMode = customsConfig.taxesMode ?? 'manual';
  const dhlUSD = summary.dhlHandlingUSD ?? 0;
  const dhlBOB = dhlUSD * exchangeRate;
  const totalLandedBOB = (summary.totalCustomsTaxesUSD + dhlUSD) * exchangeRate;

  return (
    <div className="section-card customs-card">
      <div className="section-card-header">
        <div className="section-title-wrap">
          <div className="section-icon-badge customs-badge">
            <Building2 size={20} />
          </div>
          <div>
            <div className="customs-title-row">
              <h2 className="section-title">3. Liquidación Aduanera & Cargos DHL Bolivia</h2>
              <span className="customs-tag">Aduana Nacional de Bolivia (ANB)</span>
            </div>
            <p className="section-subtitle">
              Base Imponible CIF, Gravamen Arancelario, impuestos de importación e importes reales de DHL (levy + liberación de aduana).
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

        {/* Impuestos de Importación (auto 14.94% o monto real) */}
        <div className="customs-metric-card highlight-card">
          <div className="customs-card-top">
            <div className="metric-title-group">
              <Receipt size={18} className="metric-icon iva-icon" />
              <div>
                <h4>Impuestos de Importación</h4>
                <p>{taxesMode === 'auto' ? 'GA + IVA 14.94% sobre CIF' : 'Monto real facturado por DHL'}</p>
              </div>
            </div>
            <span className="tax-badge legal-badge">
              {taxesMode === 'auto' ? '14.94% Auto' : 'Real (Bs.)'}
            </span>
          </div>

          <div className="metric-amount-row">
            <div className="main-metric-val">{formatUSD(summary.totalCustomsTaxesUSD)}</div>
            <div className="sub-metric-val">{formatBOB(summary.totalCustomsTaxesUSD * exchangeRate)}</div>
          </div>

          <label className="metric-note" style={{ cursor: 'pointer', gap: '0.4rem', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={taxesMode === 'manual'}
              onChange={(e) => onUpdateCustoms({ taxesMode: e.target.checked ? 'manual' : 'auto' })}
            />
            <span>Usar monto real pagado (Bs.)</span>
          </label>

          {taxesMode === 'manual' && (
            <div className="dhl-input-row">
              <div className="input-with-currency large-input">
                <span className="currency-symbol">Bs.</span>
                <NumericInput
                  min={0}
                  fallbackOnBlur={0}
                  allowDecimals={true}
                  value={customsConfig.manualTaxesBOB ?? 0}
                  onValueChange={(val) => onUpdateCustoms({ manualTaxesBOB: val })}
                  className="table-input"
                  placeholder="0"
                />
                <span className="input-unit">BOB</span>
              </div>
            </div>
          )}

          <div className="metric-note">
            <span>
              {taxesMode === 'auto'
                ? `Base imponible tributaria: ${formatUSD(summary.cifBaseUSD + summary.totalGaUSD)}`
                : `Prorrateado por valor CIF entre ${summary.products.length} producto(s).`}
            </span>
          </div>
        </div>

        {/* Cargos DHL: tasa base (USD) + extras reales (levy + liberación en Bs) */}
        <div className="customs-metric-card dhl-card">
          <div className="customs-card-top">
            <div className="metric-title-group">
              <Truck size={18} className="metric-icon dhl-icon" />
              <div>
                <h4>Cargos DHL Bolivia</h4>
                <p>Tasa de manejo + levy y liberación de aduana</p>
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
                value={customsConfig.dhlHandlingFeeUSD ?? 0}
                onValueChange={(val) => onUpdateCustoms({ dhlHandlingFeeUSD: val })}
                className="table-input"
                placeholder="40"
              />
              <span className="input-unit">USD · Manejo</span>
            </div>
          </div>

          <div className="dhl-input-row">
            <div className="input-with-currency large-input">
              <span className="currency-symbol">Bs.</span>
              <NumericInput
                min={0}
                fallbackOnBlur={0}
                allowDecimals={true}
                value={customsConfig.levyChargesBOB ?? 0}
                onValueChange={(val) => onUpdateCustoms({ levyChargesBOB: val })}
                className="table-input"
                placeholder="0"
              />
              <span className="input-unit">BOB · Levy</span>
            </div>
          </div>

          <div className="dhl-input-row">
            <div className="input-with-currency large-input">
              <span className="currency-symbol">Bs.</span>
              <NumericInput
                min={0}
                fallbackOnBlur={0}
                allowDecimals={true}
                value={customsConfig.customsReleaseFeeBOB ?? 0}
                onValueChange={(val) => onUpdateCustoms({ customsReleaseFeeBOB: val })}
                className="table-input"
                placeholder="0"
              />
              <span className="input-unit">BOB · Liberación</span>
            </div>
          </div>

          <div className="dhl-bob-equivalent">
            Total DHL ≈ <strong>{formatBOB(dhlBOB)}</strong> ({formatUSD(dhlUSD)})
          </div>

          <div className="metric-note">
            <span>Tasa base de manejo (automática) + levy y liberación opcionales, prorrateados por peso.</span>
          </div>
        </div>
      </div>

      {/* Resumen de Tributos & Cargos Locales */}
      <div className="customs-summary-strip">
        <div className="customs-summary-left">
          <div className="tax-breakdown-item">
            <span className="tax-item-label">Total Impuestos Aduana:</span>
            <strong className="tax-item-val">{formatUSD(summary.totalCustomsTaxesUSD)} ({formatBOB(summary.totalCustomsTaxesUSD * exchangeRate)})</strong>
          </div>
          <span className="separator">•</span>
          <div className="tax-breakdown-item">
            <span className="tax-item-label">Cargos DHL:</span>
            <strong className="tax-item-val">{formatUSD(dhlUSD)} ({formatBOB(dhlBOB)})</strong>
          </div>
        </div>

        <div className="customs-summary-right">
          <span className="customs-total-label">Total Liquidación Bolivia:</span>
          <div className="customs-grand-total">
            <span className="total-usd">{formatUSD(summary.totalCustomsTaxesUSD + dhlUSD)}</span>
            <span className="total-bob">({formatBOB(totalLandedBOB)})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
