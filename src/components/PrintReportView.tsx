import React from 'react';
import type { CalculationSummary, BoliviaCustomsConfig } from '../types/calculator';
import { formatUSD, formatBOB } from '../utils/formatters';

interface PrintReportViewProps {
  summary: CalculationSummary;
  customsConfig: BoliviaCustomsConfig;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  summary,
  customsConfig
}) => {
  return (
    <div className="printable-report-container">
      <div className="report-header">
        <div className="report-brand">
          <h1>GEA IMPORTADORA</h1>
          <p>Planilla de Liquidación de Importación Courier (MyUS & Aduana Bolivia)</p>
        </div>
        <div className="report-meta">
          <div><strong>Fecha:</strong> {new Date().toLocaleDateString('es-BO')}</div>
          <div><strong>Tasa de Cambio:</strong> 1 USD = {customsConfig.exchangeRate.toFixed(2)} BOB</div>
          <div><strong>Modalidad:</strong> Courier Aéreo / Forwarder MyUS</div>
        </div>
      </div>

      <div className="report-summary-boxes">
        <div className="rep-box">
          <span className="rep-label">FOB Compras eBay</span>
          <span className="rep-val">{formatUSD(summary.totalFobUSD)}</span>
          <span className="rep-sub">{formatBOB(summary.totalFobUSD * customsConfig.exchangeRate)}</span>
        </div>
        <div className="rep-box">
          <span className="rep-label">Courier MyUS Total</span>
          <span className="rep-val">{formatUSD(summary.totalMyUSUSD)}</span>
          <span className="rep-sub">{formatBOB(summary.totalMyUSUSD * customsConfig.exchangeRate)}</span>
        </div>
        <div className="rep-box">
          <span className="rep-label">Aduana Bolivia (GA + IVA 14.94%)</span>
          <span className="rep-val">{formatUSD(summary.totalCustomsTaxesUSD)}</span>
          <span className="rep-sub">{formatBOB(summary.totalCustomsTaxesUSD * customsConfig.exchangeRate)}</span>
        </div>
        <div className="rep-box">
          <span className="rep-label">Manejo DHL Bolivia</span>
          <span className="rep-val">{formatUSD(summary.dhlHandlingUSD)}</span>
          <span className="rep-sub">{formatBOB(summary.dhlHandlingUSD * customsConfig.exchangeRate)}</span>
        </div>
        <div className="rep-box rep-total">
          <span className="rep-label">Costo Desembarcado Total</span>
          <span className="rep-val">{formatUSD(summary.totalLandedCostUSD)}</span>
          <span className="rep-sub">{formatBOB(summary.totalLandedCostBOB)}</span>
        </div>
      </div>

      <h3>Detalle por Producto y Costos Unitarios</h3>
      <table className="report-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cant.</th>
            <th>FOB Unit.</th>
            <th>Peso</th>
            <th>Flete MyUS</th>
            <th>Aduana (GA+IVA)</th>
            <th>DHL</th>
            <th>Costo Unit. Final</th>
            <th>Precio Venta Sug.</th>
          </tr>
        </thead>
        <tbody>
          {summary.products.map((p, idx) => (
            <tr key={idx}>
              <td><strong>{p.item.name}</strong> ({p.item.sellerOrStore})</td>
              <td>{p.item.quantity}</td>
              <td>{formatUSD(p.item.unitPriceUSD)}</td>
              <td>{p.item.unitWeightLbs.toFixed(1)} lbs</td>
              <td>{formatUSD(p.proratedMyUSUSD / p.item.quantity)}</td>
              <td>{formatUSD((p.gaUSD + p.ivaUSD) / p.item.quantity)}</td>
              <td>{formatUSD(p.proratedDhlUSD / p.item.quantity)}</td>
              <td><strong>{formatUSD(p.unitLandedCostUSD)}</strong><br /><small>{formatBOB(p.unitLandedCostBOB)}</small></td>
              <td><strong>{formatUSD(p.suggestedSalePriceUSD)}</strong><br /><small>{formatBOB(p.suggestedSalePriceBOB)}</small></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="report-footer">
        <p>Documento generado automáticamente por GEA Import SaaS. Los cálculos tributarios reflejan la Ley General de Aduanas de Bolivia (IVA efectiva 14.94% sobre CIF+GA).</p>
      </div>
    </div>
  );
};
