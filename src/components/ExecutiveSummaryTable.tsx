import React from 'react';
import { 
  TableProperties, 
  ShoppingBag, 
  Package, 
  Receipt, 
  CheckCircle2
} from 'lucide-react';
import type { CalculationSummary, ProductItem } from '../types/calculator';
import { formatUSD, formatBOB } from '../utils/formatters';

interface ExecutiveSummaryTableProps {
  products: ProductItem[];
  summary: CalculationSummary;
  exchangeRate: number;
  currencyMode: 'both' | 'usd' | 'bob';
}

export const ExecutiveSummaryTable: React.FC<ExecutiveSummaryTableProps> = ({
  products,
  summary,
  exchangeRate
}) => {
  // Pilar 1: eBay Compras (FOB)
  const pilar1USD = summary.totalFobUSD;
  const pilar1BOB = pilar1USD * exchangeRate;
  const pilar1Pct = summary.totalLandedCostUSD > 0 ? (pilar1USD / summary.totalLandedCostUSD) * 100 : 0;

  // Pilar 2: MyUS Total
  const pilar2USD = summary.totalMyUSUSD;
  const pilar2BOB = pilar2USD * exchangeRate;
  const pilar2Pct = summary.totalLandedCostUSD > 0 ? (pilar2USD / summary.totalLandedCostUSD) * 100 : 0;

  // Pilar 3: IVA Bolivia + DHL ($40)
  const pilar3USD = summary.totalCustomsTaxesUSD + summary.dhlHandlingUSD;
  const pilar3BOB = pilar3USD * exchangeRate;
  const pilar3Pct = summary.totalLandedCostUSD > 0 ? (pilar3USD / summary.totalLandedCostUSD) * 100 : 0;

  // Gran Total (Pilar 1 + Pilar 2 + Pilar 3)
  const grandTotalUSD = summary.totalLandedCostUSD;
  const grandTotalBOB = summary.totalLandedCostBOB;

  return (
    <div className="section-card executive-summary-card">
      <div className="section-card-header">
        <div className="section-title-wrap">
          <div className="section-icon-badge exec-badge">
            <TableProperties size={20} />
          </div>
          <div>
            <h2 className="section-title">Resumen Maestro: Los 3 Pilares del Costo de Importación</h2>
            <p className="section-subtitle">
              Sumatoria desglosada paso a paso: Compras en eBay + Courier MyUS + Aduana & DHL, con la sumatoria final consolidada.
            </p>
          </div>
        </div>

        <div className="pillars-quick-indicator">
          <span className="pillar-mini-pill p1">1. eBay: {pilar1Pct.toFixed(1)}%</span>
          <span className="pillar-mini-pill p2">2. MyUS: {pilar2Pct.toFixed(1)}%</span>
          <span className="pillar-mini-pill p3">3. IVA & DHL: {pilar3Pct.toFixed(1)}%</span>
        </div>
      </div>

      <div className="table-responsive-container">
        <table className="custom-data-table executive-table">
          <thead>
            <tr>
              <th style={{ width: '38%' }}>Etapa / Concepto de Costo</th>
              <th style={{ width: '22%' }}>Detalle de Cálculo</th>
              <th style={{ width: '18%', textAlign: 'right' }}>Monto en USD ($)</th>
              <th style={{ width: '22%', textAlign: 'right' }}>Monto en Bolivianos (Bs.)</th>
            </tr>
          </thead>
          <tbody>
            {/* =========================================================
                PILAR 1: COMPRAS EN EBAY (FOB)
               ========================================================= */}
            <tr className="pillar-header-row pilar-1-header">
              <td colSpan={4}>
                <div className="pillar-title-cell">
                  <ShoppingBag size={16} className="text-cyan" />
                  <strong>PILAR 1: COMPRAS EN EBAY (VALOR FOB PRODUCTOS)</strong>
                </div>
              </td>
            </tr>

            {products.map((item, index) => {
              const itemTotalUSD = item.quantity * item.unitPriceUSD;
              const itemTotalBOB = itemTotalUSD * exchangeRate;
              return (
                <tr key={item.id} className="sub-detail-row">
                  <td className="item-name-col">
                    <span className="bullet-dot">•</span>
                    <span className="detail-item-title">
                      {item.name || `Producto #${index + 1}`}
                    </span>
                    <span className="item-store-tag">({item.sellerOrStore || 'eBay'})</span>
                  </td>
                  <td className="detail-desc-col">
                    {item.quantity} ud{item.quantity > 1 ? 's' : ''} × {formatUSD(item.unitPriceUSD)} ({item.unitWeightLbs} lbs/ud)
                  </td>
                  <td className="text-right number-col">{formatUSD(itemTotalUSD)}</td>
                  <td className="text-right number-col sub-bob-col">{formatBOB(itemTotalBOB)}</td>
                </tr>
              );
            })}

            <tr className="subtotal-row pilar-1-subtotal">
              <td colSpan={2}>
                <div className="subtotal-label-cell">
                  <strong>SUBTOTAL PILAR 1 (Compras eBay FOB):</strong>
                  <span className="subtotal-note">Base comercial de partida ({pilar1Pct.toFixed(1)}% del total)</span>
                </div>
              </td>
              <td className="text-right subtotal-usd">{formatUSD(pilar1USD)}</td>
              <td className="text-right subtotal-bob">{formatBOB(pilar1BOB)}</td>
            </tr>

            {/* =========================================================
                PILAR 2: COURIER INTERNACIONAL (MYUS)
               ========================================================= */}
            <tr className="pillar-header-row pilar-2-header">
              <td colSpan={4}>
                <div className="pillar-title-cell">
                  <Package size={16} className="text-indigo" />
                  <strong>PILAR 2: COURIER INTERNACIONAL MYUS (FLORIDA ➔ BOLIVIA)</strong>
                </div>
              </td>
            </tr>

            <tr className="sub-detail-row">
              <td className="item-name-col">
                <span className="bullet-dot">•</span>
                <span>Shipping Charges (Flete Internacional)</span>
              </td>
              <td className="detail-desc-col">
                DHL Express Smallbox ({summary.totalWeightLbs.toFixed(2)} lbs de peso)
              </td>
              <td className="text-right number-col">{formatUSD(summary.myusShippingUSD)}</td>
              <td className="text-right number-col sub-bob-col">{formatBOB(summary.myusShippingUSD * exchangeRate)}</td>
            </tr>

            <tr className="sub-detail-row">
              <td className="item-name-col">
                <span className="bullet-dot">•</span>
                <span>Shipping Preferences (Seguro MyUS)</span>
              </td>
              <td className="detail-desc-col">
                $3.50 USD por cada $100 USD de FOB
              </td>
              <td className="text-right number-col">{formatUSD(summary.myusShippingPreferencesUSD)}</td>
              <td className="text-right number-col sub-bob-col">{formatBOB(summary.myusShippingPreferencesUSD * exchangeRate)}</td>
            </tr>

            {summary.myusPackageLevelUSD > 0 && (
              <tr className="sub-detail-row">
                <td className="item-name-col">
                  <span className="bullet-dot">•</span>
                  <span>Package Level Charges (Cargo de Suite)</span>
                </td>
                <td className="detail-desc-col">
                  Penalización por búsqueda / casillero no identificado
                </td>
                <td className="text-right number-col">{formatUSD(summary.myusPackageLevelUSD)}</td>
                <td className="text-right number-col sub-bob-col">{formatBOB(summary.myusPackageLevelUSD * exchangeRate)}</td>
              </tr>
            )}

            {summary.myusLithiumStickersUSD > 0 && (
              <tr className="sub-detail-row">
                <td className="item-name-col">
                  <span className="bullet-dot">•</span>
                  <span>Lithium-ion Stickers</span>
                </td>
                <td className="detail-desc-col">
                  Sticker de seguridad para baterías de litio
                </td>
                <td className="text-right number-col">{formatUSD(summary.myusLithiumStickersUSD)}</td>
                <td className="text-right number-col sub-bob-col">{formatBOB(summary.myusLithiumStickersUSD * exchangeRate)}</td>
              </tr>
            )}

            {summary.myusConsolidationUSD > 0 && (
              <tr className="sub-detail-row">
                <td className="item-name-col">
                  <span className="bullet-dot">•</span>
                  <span>Consolidación de Paquetes</span>
                </td>
                <td className="detail-desc-col">
                  Tarifa de unificación para usuario Free
                </td>
                <td className="text-right number-col">{formatUSD(summary.myusConsolidationUSD)}</td>
                <td className="text-right number-col sub-bob-col">{formatBOB(summary.myusConsolidationUSD * exchangeRate)}</td>
              </tr>
            )}

            <tr className="subtotal-row pilar-2-subtotal">
              <td colSpan={2}>
                <div className="subtotal-label-cell">
                  <strong>SUBTOTAL PILAR 2 (Factura Courier MyUS):</strong>
                  <span className="subtotal-note">Se suma al FOB para formar la Base Imponible CIF ({pilar2Pct.toFixed(1)}% del total)</span>
                </div>
              </td>
              <td className="text-right subtotal-usd">{formatUSD(pilar2USD)}</td>
              <td className="text-right subtotal-bob">{formatBOB(pilar2BOB)}</td>
            </tr>

            {/* =========================================================
                PILAR 3: LIQUIDACIÓN ADUANERA BOLIVIA & MANEJO DHL
               ========================================================= */}
            <tr className="pillar-header-row pilar-3-header">
              <td colSpan={4}>
                <div className="pillar-title-cell">
                  <Receipt size={16} className="text-amber" />
                  <strong>PILAR 3: LIQUIDACIÓN FISCAL BOLIVIA & TASA DHL</strong>
                </div>
              </td>
            </tr>

            <tr className="sub-detail-row">
              <td className="item-name-col">
                <span className="bullet-dot">•</span>
                <span>IVA Efectivo de Importación (14.94%)</span>
              </td>
              <td className="detail-desc-col">
                14.94% sobre Base CIF ({formatUSD(summary.cifBaseUSD)})
              </td>
              <td className="text-right number-col">{formatUSD(summary.totalIvaUSD)}</td>
              <td className="text-right number-col sub-bob-col">{formatBOB(summary.totalIvaUSD * exchangeRate)}</td>
            </tr>

            <tr className="sub-detail-row">
              <td className="item-name-col">
                <span className="bullet-dot">•</span>
                <span>Gravamen Arancelario (GA)</span>
              </td>
              <td className="detail-desc-col">
                {summary.totalGaUSD === 0 ? '0% Exento (Tecnología y Electrónica)' : 'Arancel sobre CIF'}
              </td>
              <td className="text-right number-col">{formatUSD(summary.totalGaUSD)}</td>
              <td className="text-right number-col sub-bob-col">{formatBOB(summary.totalGaUSD * exchangeRate)}</td>
            </tr>

            <tr className="sub-detail-row">
              <td className="item-name-col">
                <span className="bullet-dot">•</span>
                <span>Tasa de Manejo y Despacho DHL Bolivia</span>
              </td>
              <td className="detail-desc-col">
                Cargo fijo de desaduanamiento courier en Bolivia
              </td>
              <td className="text-right number-col">{formatUSD(summary.dhlHandlingUSD)}</td>
              <td className="text-right number-col sub-bob-col">{formatBOB(summary.dhlHandlingUSD * exchangeRate)}</td>
            </tr>

            <tr className="subtotal-row pilar-3-subtotal">
              <td colSpan={2}>
                <div className="subtotal-label-cell">
                  <strong>SUBTOTAL PILAR 3 (IVA Aduana + Manejo DHL):</strong>
                  <span className="subtotal-note">Impuestos y desaduanamiento en Bolivia ({pilar3Pct.toFixed(1)}% del total)</span>
                </div>
              </td>
              <td className="text-right subtotal-usd">{formatUSD(pilar3USD)}</td>
              <td className="text-right subtotal-bob">{formatBOB(pilar3BOB)}</td>
            </tr>

            {/* =========================================================
                SUMATORIA FINAL CONSOLIDADA (1 + 2 + 3)
               ========================================================= */}
            <tr className="grand-total-row">
              <td colSpan={2}>
                <div className="grand-total-title-wrap">
                  <div className="check-badge">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <strong className="grand-total-heading">
                      SUMATORIA FINAL (PILAR 1 + PILAR 2 + PILAR 3)
                    </strong>
                    <span className="grand-total-formula">
                      Compras eBay ({formatUSD(pilar1USD)}) + MyUS ({formatUSD(pilar2USD)}) + IVA & DHL ({formatUSD(pilar3USD)})
                    </span>
                  </div>
                </div>
              </td>

              <td className="text-right grand-total-usd-cell">
                <div className="grand-usd-display">
                  <span className="tag-final">TOTAL USD</span>
                  <strong>{formatUSD(grandTotalUSD)}</strong>
                </div>
              </td>

              <td className="text-right grand-total-bob-cell">
                <div className="grand-bob-display">
                  <span className="tag-final">TOTAL BOB (12.26)</span>
                  <strong>{formatBOB(grandTotalBOB)}</strong>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="executive-summary-footer">
        <div className="formula-summary-chip">
          <span className="chip-label">Fórmula Consolidada de la Importación:</span>
          <div className="chip-equation">
            <span className="eq-pilar p1-color">Pilar 1: Compras eBay ({formatUSD(pilar1USD)})</span>
            <span className="eq-op">+</span>
            <span className="eq-pilar p2-color">Pilar 2: Factura MyUS ({formatUSD(pilar2USD)})</span>
            <span className="eq-op">+</span>
            <span className="eq-pilar p3-color">Pilar 3: IVA & DHL ({formatUSD(pilar3USD)})</span>
            <span className="eq-op">=</span>
            <span className="eq-result">{formatUSD(grandTotalUSD)} ({formatBOB(grandTotalBOB)})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
