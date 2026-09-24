import React from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Scale
} from 'lucide-react';
import type { ProductCalculated } from '../types/calculator';
import { formatUSD, formatBOB } from '../utils/formatters';

interface ProductCostBreakdownTableProps {
  products: ProductCalculated[];
  exchangeRate: number;
  currencyMode: 'both' | 'usd' | 'bob';
}

export const ProductCostBreakdownTable: React.FC<ProductCostBreakdownTableProps> = ({
  products,
  currencyMode
}) => {

  return (
    <div className="section-card breakdown-section-card">
      <div className="section-card-header">
        <div className="section-title-wrap">
          <div className="section-icon-badge breakdown-badge">
            <Calculator size={20} />
          </div>
          <div>
            <h2 className="section-title">5. Prorrateo Unitario & Fijación de Precios de Venta</h2>
            <p className="section-subtitle">
              Desglose exacto de cómo se distribuyen los costos de MyUS, aduana e importe DHL en cada artículo, y precio sugerido en Bolivia.
            </p>
          </div>
        </div>
      </div>

      <div className="table-responsive-container">
        <table className="custom-data-table breakdown-table">
          <thead>
            <tr>
              <th style={{ width: '22%' }}>Producto</th>
              <th style={{ width: '8%', textAlign: 'center' }}>Cant.</th>
              <th style={{ width: '10%' }}>FOB Unit.</th>
              <th style={{ width: '11%' }}>Flete MyUS (Peso)</th>
              <th style={{ width: '12%' }}>Impuestos Bo (GA+IVA)</th>
              <th style={{ width: '9%' }}>DHL ($40)</th>
              <th style={{ width: '14%' }} className="highlight-th">Costo Unit. Bolivia</th>
              <th style={{ width: '14%' }} className="sale-th">Precio Venta Sug.</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item) => {
              const myusPerUnit = item.item.quantity > 0 ? item.proratedMyUSUSD / item.item.quantity : 0;
              const taxesPerUnit = item.item.quantity > 0 ? (item.gaUSD + item.ivaUSD) / item.item.quantity : 0;
              const dhlPerUnit = item.item.quantity > 0 ? item.proratedDhlUSD / item.item.quantity : 0;

              return (
                <tr key={item.item.id} className="breakdown-row">
                  <td>
                    <div className="product-item-cell">
                      <strong className="item-name">{item.item.name || 'Sin nombre'}</strong>
                      <span className="item-sub">
                        {item.item.sellerOrStore || 'eBay'} • {item.totalWeightLbs.toFixed(1)} lbs ({item.fobWeightRatio.toFixed(1)}% peso)
                      </span>
                    </div>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <span className="qty-tag">{item.item.quantity}</span>
                  </td>

                  <td>
                    <div className="fob-cell">
                      <span>{formatUSD(item.item.unitPriceUSD)}</span>
                    </div>
                  </td>

                  <td>
                    <div className="sub-cost-cell">
                      <span className="cost-main">{formatUSD(myusPerUnit)}</span>
                      <span className="cost-sub">Total: {formatUSD(item.proratedMyUSUSD)}</span>
                    </div>
                  </td>

                  <td>
                    <div className="sub-cost-cell">
                      <span className="cost-main">{formatUSD(taxesPerUnit)}</span>
                      <span className="cost-sub">
                        GA ({item.item.gaPercent}%): {formatUSD(item.gaUSD / item.item.quantity)} + IVA
                      </span>
                    </div>
                  </td>

                  <td>
                    <div className="sub-cost-cell">
                      <span className="cost-main">{formatUSD(dhlPerUnit)}</span>
                      <span className="cost-sub">cuota DHL</span>
                    </div>
                  </td>

                  <td className="landed-cost-cell">
                    <div className="landed-badge">
                      {currencyMode !== 'bob' && (
                        <span className="landed-usd">{formatUSD(item.unitLandedCostUSD)}</span>
                      )}
                      {currencyMode !== 'usd' && (
                        <span className="landed-bob">{formatBOB(item.unitLandedCostBOB)}</span>
                      )}
                    </div>
                    <span className="total-lot-hint">
                      Lote: {currencyMode === 'usd' ? formatUSD(item.totalLandedCostUSD) : currencyMode === 'bob' ? formatBOB(item.totalLandedCostBOB) : `${formatUSD(item.totalLandedCostUSD)} (${formatBOB(item.totalLandedCostBOB)})`}
                    </span>
                  </td>

                  <td className="suggested-sale-cell">
                    <div className="sale-badge">
                      {currencyMode !== 'bob' && (
                        <span className="sale-usd">{formatUSD(item.suggestedSalePriceUSD)}</span>
                      )}
                      {currencyMode !== 'usd' && (
                        <span className="sale-bob">{formatBOB(item.suggestedSalePriceBOB)}</span>
                      )}
                    </div>
                    <div className="profit-margin-row">
                      <span className="margin-pill">+{item.item.targetMarginPercent}%</span>
                      <span className="profit-text">
                        Ganancia: {currencyMode === 'usd' ? `+${formatUSD(item.unitProfitUSD)}` : `+${formatBOB(item.unitProfitBOB)}`}/ud
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="breakdown-footer-info">
        <div className="footer-legend-item">
          <Scale size={14} className="text-accent" />
          <span>El costo de flete MyUS y tasa de manejo DHL se prorratean en base al peso de cada producto.</span>
        </div>
        <div className="footer-legend-item">
          <TrendingUp size={14} className="text-emerald" />
          <span>El precio sugerido incluye la cobertura de todos los costos desembarcados más el margen deseado.</span>
        </div>
      </div>
    </div>
  );
};
