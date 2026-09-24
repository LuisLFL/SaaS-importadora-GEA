import React from 'react';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  Scale, 
  Sparkles
} from 'lucide-react';
import type { CalculationSummary } from '../types/calculator';
import { formatUSD, formatBOB, formatPercent } from '../utils/formatters';

interface AnalyticsDashboardProps {
  summary: CalculationSummary;
  exchangeRate: number;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  summary,
  exchangeRate
}) => {
  // Porcentajes para la barra de distribución
  const fobPercent = summary.totalLandedCostUSD > 0 
    ? (summary.totalFobUSD / summary.totalLandedCostUSD) * 100 
    : 0;
  const myusPercent = summary.totalLandedCostUSD > 0 
    ? (summary.totalMyUSUSD / summary.totalLandedCostUSD) * 100 
    : 0;
  const customsPercent = summary.totalLandedCostUSD > 0 
    ? (summary.totalCustomsTaxesUSD / summary.totalLandedCostUSD) * 100 
    : 0;
  const dhlPercent = summary.totalLandedCostUSD > 0 
    ? (summary.dhlHandlingUSD / summary.totalLandedCostUSD) * 100 
    : 0;

  return (
    <div className="analytics-card">
      <div className="analytics-header">
        <div className="section-title-wrap">
          <div className="section-icon-badge kpi-badge">
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 className="section-title">4. Métricas Clave & Rentabilidad (KPIs)</h2>
            <p className="section-subtitle">
              Resumen ejecutivo consolidado del costo de importación, distribución del gasto y retorno proyectado.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {/* KPI 1: Costo Total Desembarcado */}
        <div className="kpi-card highlight-kpi">
          <div className="kpi-top">
            <span className="kpi-label">Costo Total Puesto en Bolivia</span>
            <DollarSign className="kpi-icon text-emerald" size={18} />
          </div>
          <div className="kpi-main-val">{formatUSD(summary.totalLandedCostUSD)}</div>
          <div className="kpi-sub-val">{formatBOB(summary.totalLandedCostBOB)}</div>
          <div className="kpi-footer-note">
            <span>Incluye FOB + MyUS + Impuestos + DHL</span>
          </div>
        </div>

        {/* KPI 2: Multiplicador sobre FOB */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Factor Multiplicador</span>
            <Sparkles className="kpi-icon text-accent" size={18} />
          </div>
          <div className="kpi-main-val">
            {summary.totalCostMultiplier.toFixed(2)}x
          </div>
          <div className="kpi-sub-val">
            +{( (summary.totalCostMultiplier - 1) * 100 ).toFixed(1)}% sobre valor FOB
          </div>
          <div className="kpi-footer-note">
            <span>Costo final vs precio de compra</span>
          </div>
        </div>

        {/* KPI 3: Costo Real por Libra */}
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Costo Total por Libra</span>
            <Scale className="kpi-icon text-amber" size={18} />
          </div>
          <div className="kpi-main-val">
            {formatUSD(summary.costPerLbUSD)} <span className="kpi-unit">/ lb</span>
          </div>
          <div className="kpi-sub-val">
            {formatUSD(summary.costPerKgUSD)} / kg ({formatBOB(summary.costPerLbUSD * exchangeRate)}/lb)
          </div>
          <div className="kpi-footer-note">
            <span>Para {summary.totalWeightLbs.toFixed(1)} lbs importadas</span>
          </div>
        </div>

        {/* KPI 4: Utilidad y ROI Proyectado */}
        <div className="kpi-card profit-kpi">
          <div className="kpi-top">
            <span className="kpi-label">Ganancia Bruta Proyectada</span>
            <TrendingUp className="kpi-icon text-emerald" size={18} />
          </div>
          <div className="kpi-main-val">
            +{formatUSD(summary.totalProjectedProfitUSD)}
          </div>
          <div className="kpi-sub-val">
            +{formatBOB(summary.totalProjectedProfitBOB)} ({formatPercent(summary.overallRoiPercent)} ROI)
          </div>
          <div className="kpi-footer-note">
            <span>Ingreso total estimado: {formatUSD(summary.totalProjectedRevenueUSD)}</span>
          </div>
        </div>
      </div>

      {/* Breakdown Distribution Bar */}
      <div className="distribution-bar-section">
        <div className="dist-title-row">
          <span className="dist-heading">Distribución del Costo Total:</span>
          <span className="dist-total-hint">100% = {formatUSD(summary.totalLandedCostUSD)}</span>
        </div>

        <div className="stacked-progress-bar">
          <div 
            className="bar-segment seg-fob" 
            style={{ width: `${Math.max(2, fobPercent)}%` }}
            title={`FOB Compras eBay: ${formatUSD(summary.totalFobUSD)} (${fobPercent.toFixed(1)}%)`}
          />
          <div 
            className="bar-segment seg-myus" 
            style={{ width: `${Math.max(2, myusPercent)}%` }}
            title={`Courier MyUS: ${formatUSD(summary.totalMyUSUSD)} (${myusPercent.toFixed(1)}%)`}
          />
          <div 
            className="bar-segment seg-customs" 
            style={{ width: `${Math.max(2, customsPercent)}%` }}
            title={`Impuestos Bolivia (GA+IVA): ${formatUSD(summary.totalCustomsTaxesUSD)} (${customsPercent.toFixed(1)}%)`}
          />
          <div 
            className="bar-segment seg-dhl" 
            style={{ width: `${Math.max(1, dhlPercent)}%` }}
            title={`Manejo DHL ($40): ${formatUSD(summary.dhlHandlingUSD)} (${dhlPercent.toFixed(1)}%)`}
          />
        </div>

        <div className="dist-legend">
          <div className="legend-item">
            <span className="dot dot-fob" />
            <span className="legend-name">Compras eBay (FOB):</span>
            <span className="legend-val">{fobPercent.toFixed(1)}%</span>
            <span className="legend-amount">({formatUSD(summary.totalFobUSD)})</span>
          </div>
          <div className="legend-item">
            <span className="dot dot-myus" />
            <span className="legend-name">MyUS Logistics:</span>
            <span className="legend-val">{myusPercent.toFixed(1)}%</span>
            <span className="legend-amount">({formatUSD(summary.totalMyUSUSD)})</span>
          </div>
          <div className="legend-item">
            <span className="dot dot-customs" />
            <span className="legend-name">Aduana Bolivia (GA + 14.94% IVA):</span>
            <span className="legend-val">{customsPercent.toFixed(1)}%</span>
            <span className="legend-amount">({formatUSD(summary.totalCustomsTaxesUSD)})</span>
          </div>
          <div className="legend-item">
            <span className="dot dot-dhl" />
            <span className="legend-name">Manejo DHL:</span>
            <span className="legend-val">{dhlPercent.toFixed(1)}%</span>
            <span className="legend-amount">({formatUSD(summary.dhlHandlingUSD)})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
