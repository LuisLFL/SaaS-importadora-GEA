import React, { useState } from 'react';
import { 
  Calculator, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw, 
  ShoppingBag, 
  Package, 
  Receipt, 
  DollarSign, 
  TrendingUp, 
  EyeOff,
  Maximize2,
  Minimize2,
  List
} from 'lucide-react';
import type { CalculationSummary } from '../types/calculator';
import { formatUSD, formatBOB } from '../utils/formatters';

interface FloatingSummaryTableProps {
  summary: CalculationSummary;
  exchangeRate: number;
  currencyMode: 'both' | 'usd' | 'bob';
  totalProductsCount: number;
  activeProductsCount: number;
  excludedCount: number;
  onRestoreAllProducts: () => void;
}

export const FloatingSummaryTable: React.FC<FloatingSummaryTableProps> = ({
  summary,
  exchangeRate,
  currencyMode,
  totalProductsCount,
  activeProductsCount,
  excludedCount,
  onRestoreAllProducts
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showItemBreakdown, setShowItemBreakdown] = useState(false);

  // Pilares y sumatoria
  const pilar1USD = summary.totalFobUSD;
  const pilar1BOB = pilar1USD * exchangeRate;

  const pilar2USD = summary.totalMyUSUSD;
  const pilar2BOB = pilar2USD * exchangeRate;

  const pilar3USD = summary.totalCustomsTaxesUSD + summary.dhlHandlingUSD;
  const pilar3BOB = pilar3USD * exchangeRate;

  const grandTotalUSD = summary.totalLandedCostUSD;
  const grandTotalBOB = summary.totalLandedCostBOB;

  const projectedRevenueUSD = summary.totalProjectedRevenueUSD;
  const projectedRevenueBOB = summary.totalProjectedRevenueBOB;

  const totalProfitUSD = summary.totalProjectedProfitUSD;
  const totalProfitBOB = summary.totalProjectedProfitBOB;
  const roiPercent = summary.overallRoiPercent;

  // Si está minimizado, mostrar píldora flotante compacta
  if (isMinimized) {
    return (
      <aside aria-label="Resumen financiero flotante minimizado" className="floating-summary-minimized-pill" onClick={() => setIsMinimized(false)}>
        <div className="mini-pill-pulse-dot" />
        <Calculator size={14} className="text-cyan" />
        <div className="mini-pill-content">
          <span className="mini-pill-label">Cálculos Finales</span>
          <span className="mini-pill-value">
            {currencyMode === 'bob' ? formatBOB(grandTotalBOB) : formatUSD(grandTotalUSD)}
          </span>
        </div>
        {excludedCount > 0 && (
          <span className="mini-pill-sim-chip" title={`${excludedCount} producto(s) oculto(s)`}>
            ⚡ {excludedCount}
          </span>
        )}
        <button 
          type="button" 
          className="mini-pill-expand-btn" 
          aria-label="Expandir cálculos finales"
          title="Expandir tabla flotante"
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(false);
          }}
        >
          <Maximize2 size={12} />
        </button>
      </aside>
    );
  }

  return (
    <aside aria-label="Resumen de cálculos finales en vivo" className="floating-summary-container">
      {/* Cabecera del Widget Flotante */}
      <div className="floating-summary-header">
        <div className="floating-header-title-wrap">
          <div className="floating-pulse-badge">
            <span className="floating-dot-live" />
            <Calculator size={14} className="text-cyan" />
          </div>
          <div>
            <h4 className="floating-title">Cálculos Finales</h4>
            <span className="floating-subtitle">
              {activeProductsCount} de {totalProductsCount} artículos activos
            </span>
          </div>
        </div>

        <div className="floating-header-actions">
          {excludedCount > 0 && (
            <button
              type="button"
              className="floating-restore-btn"
              onClick={onRestoreAllProducts}
              title={`Restaurar ${excludedCount} producto(s) oculto(s)`}
            >
              <RotateCcw size={11} />
              <span>Restaurar ({excludedCount})</span>
            </button>
          )}

          <button
            type="button"
            className="floating-minimize-btn"
            onClick={() => setIsMinimized(true)}
            title="Minimizar panel flotante"
          >
            <Minimize2 size={13} />
          </button>
        </div>
      </div>

      {/* Alerta de Simulación Activa */}
      {excludedCount > 0 && (
        <div className="floating-sim-banner">
          <EyeOff size={12} className="text-amber" />
          <span>
            <strong>Simulación What-If:</strong> {excludedCount} oculto{excludedCount > 1 ? 's' : ''} ({activeProductsCount} restantes)
          </span>
        </div>
      )}

      {/* Hero: Costo Desembarcado Final */}
      <div className="floating-hero-card">
        <span className="floating-hero-label">Costo Total Desembarcado</span>
        <div className="floating-hero-values">
          {currencyMode !== 'bob' && (
            <span className="floating-hero-usd">{formatUSD(grandTotalUSD)}</span>
          )}
          {currencyMode !== 'usd' && (
            <span className="floating-hero-bob">{formatBOB(grandTotalBOB)}</span>
          )}
        </div>
        <div className="floating-hero-meta">
          <span>{summary.totalWeightLbs.toFixed(1)} lbs facturables</span>
          <span>•</span>
          <span>T.C: {exchangeRate.toFixed(2)} Bs/$</span>
        </div>
      </div>

      {/* Mini-Tabla de Pilares y Totales */}
      <div className="floating-table-wrapper">
        <table className="floating-mini-data-table">
          <thead>
            <tr>
              <th>Concepto</th>
              <th className="text-right">USD ($)</th>
              <th className="text-right">BOB (Bs.)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="floating-concept-cell">
                  <ShoppingBag size={11} className="text-cyan" />
                  <span>1. FOB eBay</span>
                </div>
              </td>
              <td className="text-right font-mono">{formatUSD(pilar1USD)}</td>
              <td className="text-right font-mono text-muted">{formatBOB(pilar1BOB)}</td>
            </tr>

            <tr>
              <td>
                <div className="floating-concept-cell">
                  <Package size={11} className="text-indigo" />
                  <span>2. Courier MyUS</span>
                </div>
              </td>
              <td className="text-right font-mono">{formatUSD(pilar2USD)}</td>
              <td className="text-right font-mono text-muted">{formatBOB(pilar2BOB)}</td>
            </tr>

            <tr>
              <td>
                <div className="floating-concept-cell">
                  <Receipt size={11} className="text-emerald" />
                  <span>3. Aduana & DHL</span>
                </div>
              </td>
              <td className="text-right font-mono">{formatUSD(pilar3USD)}</td>
              <td className="text-right font-mono text-muted">{formatBOB(pilar3BOB)}</td>
            </tr>

            <tr className="floating-row-total">
              <td>
                <strong>Costo Total</strong>
              </td>
              <td className="text-right font-mono text-accent">
                <strong>{formatUSD(grandTotalUSD)}</strong>
              </td>
              <td className="text-right font-mono text-accent">
                <strong>{formatBOB(grandTotalBOB)}</strong>
              </td>
            </tr>

            <tr className="floating-row-sales">
              <td>
                <div className="floating-concept-cell">
                  <DollarSign size={11} className="text-amber" />
                  <span>Venta Sugerida</span>
                </div>
              </td>
              <td className="text-right font-mono text-amber">{formatUSD(projectedRevenueUSD)}</td>
              <td className="text-right font-mono text-amber">{formatBOB(projectedRevenueBOB)}</td>
            </tr>

            <tr className="floating-row-profit">
              <td>
                <div className="floating-concept-cell">
                  <TrendingUp size={11} className="text-emerald" />
                  <span>Ganancia Neta</span>
                </div>
              </td>
              <td className="text-right font-mono text-emerald">+{formatUSD(totalProfitUSD)}</td>
              <td className="text-right font-mono text-emerald font-bold" title={`ROI: +${roiPercent.toFixed(1)}%`}>
                +{formatBOB(totalProfitBOB)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Desglose rápido por producto (acordeón expandible) */}
      {summary.products.length > 0 && (
        <div className="floating-accordion-section">
          <button
            type="button"
            className="floating-accordion-toggle"
            onClick={() => setShowItemBreakdown(!showItemBreakdown)}
          >
            <div className="toggle-left">
              <List size={12} />
              <span>Ver desglose por artículo ({summary.products.length})</span>
            </div>
            {showItemBreakdown ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showItemBreakdown && (
            <div className="floating-items-list">
              {summary.products.map((p) => {
                const qty = p.item.quantity || 1;
                return (
                  <div key={p.item.id} className="floating-item-row">
                    <div className="item-title-box">
                      <span className="item-title-name" title={p.item.name || 'Sin nombre'}>
                        {p.item.name || 'Sin nombre'}
                      </span>
                      <span className="item-qty-tag">{qty} ud{qty > 1 ? 's' : ''}</span>
                    </div>
                    <div className="item-costs-box">
                      <span className="item-unit-cost" title="Costo unitario Bolivia">
                        C: {currencyMode === 'bob' ? formatBOB(p.unitLandedCostBOB) : formatUSD(p.unitLandedCostUSD)}
                      </span>
                      <span className="item-unit-sale" title="Precio venta sugerido">
                        V: {currencyMode === 'bob' ? formatBOB(p.suggestedSalePriceBOB) : formatUSD(p.suggestedSalePriceUSD)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
