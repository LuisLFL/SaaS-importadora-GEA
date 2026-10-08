import React from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Scale,
  Lock,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';
import type { ProductCalculated, CustomProrationOverrides, ProductItem } from '../types/calculator';
import { formatUSD, formatBOB } from '../utils/formatters';
import { NumericInput } from './NumericInput';

interface ProductCostBreakdownTableProps {
  products: ProductCalculated[];
  allProducts?: ProductItem[];
  exchangeRate: number;
  currencyMode: 'both' | 'usd' | 'bob';
  customProration?: CustomProrationOverrides;
  onUpdateTaxOverride?: (productId: string, val: number) => void;
  onUpdateDhlOverride?: (productId: string, val: number) => void;
  onClearTaxOverride?: (productId: string) => void;
  onClearDhlOverride?: (productId: string) => void;
  onResetAllOverrides?: () => void;
  onToggleExcludeProduct?: (productId: string) => void;
  onRestoreAllProducts?: () => void;
  totalCustomsTaxesUSD?: number;
  totalDhlHandlingUSD?: number;
}

export const ProductCostBreakdownTable: React.FC<ProductCostBreakdownTableProps> = ({
  products,
  allProducts = [],
  currencyMode,
  customProration,
  onUpdateTaxOverride,
  onUpdateDhlOverride,
  onClearTaxOverride,
  onClearDhlOverride,
  onResetAllOverrides,
  onToggleExcludeProduct,
  onRestoreAllProducts,
  totalCustomsTaxesUSD = 0,
  totalDhlHandlingUSD = 40
}) => {
  const canRedistribute = products.length >= 2;
  const manualTaxes = customProration?.manualUnitTaxes || {};
  const manualDhl = customProration?.manualUnitDhl || {};
  const hasTaxOverrides = Object.keys(manualTaxes).length > 0;
  const hasDhlOverrides = Object.keys(manualDhl).length > 0;
  const hasAnyOverrides = canRedistribute && (hasTaxOverrides || hasDhlOverrides);

  // Excluidos
  const excludedItems = allProducts.filter(p => !!p.isExcluded);
  const excludedCount = excludedItems.length;

  // Mapa de productos calculados
  const calculatedMap = new Map<string, ProductCalculated>(
    products.map(p => [p.item.id, p])
  );

  // Lista a renderizar: si se pasa allProducts, usamos allProducts para mantener el orden de filas; sino products
  const displayItems: ProductItem[] = allProducts.length > 0 ? allProducts : products.map(p => p.item);

  return (
    <div className="section-card breakdown-section-card">
      <div className="section-card-header">
        <div className="section-title-wrap">
          <div className="section-icon-badge breakdown-badge">
            <Calculator size={20} />
          </div>
          <div>
            <div className="section-title-row">
              <h2 className="section-title">5. Prorrateo Unitario & Fijación de Precios de Venta</h2>
              {excludedCount > 0 ? (
                <span className="section-status-chip sim-chip">
                  <EyeOff size={13} />
                  Simulación: {excludedCount} oculto{excludedCount > 1 ? 's' : ''} ({products.length} activos)
                </span>
              ) : hasAnyOverrides ? (
                <span className="section-status-chip active">
                  <Sparkles size={13} />
                  Prorrateo redistribuido activo
                </span>
              ) : canRedistribute ? (
                <span className="section-status-chip ready">
                  <SlidersHorizontal size={13} />
                  Redistribución disponible ({products.length} artículos)
                </span>
              ) : null}
            </div>
            <p className="section-subtitle">
              Desglose exacto de costos por artículo. Puedes marcar <strong>Ocultar</strong> en cualquier box para simular los costos finales sin ese producto, o ajustar los Impuestos/DHL para redistribuir.
            </p>
          </div>
        </div>

        {excludedCount > 0 && onRestoreAllProducts && (
          <div className="section-header-actions">
            <button
              type="button"
              className="action-btn secondary-btn"
              onClick={onRestoreAllProducts}
              title="Restaurar todos los productos excluidos"
            >
              <RotateCcw size={15} />
              <span>Restaurar todos ({allProducts.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Banner de Notificación de Simulación en Tabla Final */}
      {excludedCount > 0 && (
        <div className="simulation-notice-bar">
          <div className="simulation-notice-left">
            <div className="simulation-pulse-icon">
              <EyeOff size={15} />
            </div>
            <div className="simulation-notice-text">
              <strong>Simulación What-If Activa:</strong> Se {excludedCount === 1 ? 'ha ocultado 1 producto' : `han ocultado ${excludedCount} productos`} ({products.length} activos). El prorrateo aduanero, flete y costos desembarcados se han recalculado con los productos restantes.
            </div>
          </div>
          {onRestoreAllProducts && (
            <button
              type="button"
              className="btn-restore-all-simulation"
              onClick={onRestoreAllProducts}
            >
              <RotateCcw size={13} />
              <span>Restaurar todos ({allProducts.length})</span>
            </button>
          )}
        </div>
      )}

      <div className="table-responsive-container">
        <table className="custom-data-table breakdown-table">
          <thead>
            <tr>
              <th style={{ width: '6%', textAlign: 'center' }} title="Marcar box para ocultar este producto y recalcular los costos con los restantes">
                <div className="th-center-wrap">
                  <span>Ocultar</span>
                </div>
              </th>
              <th style={{ width: '18%' }}>Producto</th>
              <th style={{ width: '5%', textAlign: 'center' }}>Cant.</th>
              <th style={{ width: '9%' }}>FOB Unit.</th>
              
              {/* Courier MyUS: No editable (ligado al peso) */}
              <th style={{ width: '12%' }}>
                <div className="th-cell-header">
                  <span>Courier MyUS</span>
                  <span className="th-badge-fixed" title="El flete Courier está ligado estrictamente al peso físico (lbs en avión). No es modificable.">
                    <Lock size={10} /> Peso
                  </span>
                </div>
              </th>

              {/* Impuestos BO: Editable cuando >= 2 artículos */}
              <th style={{ width: '13%' }}>
                <div className="th-cell-header">
                  <span>Impuestos Bo</span>
                  {canRedistribute ? (
                    <span className="th-badge-editable" title="Columna editable: al modificar un artículo, el saldo se redistribuye entre los demás conservando el total.">
                      <SlidersHorizontal size={10} /> Ajustable
                    </span>
                  ) : (
                    <span className="th-badge-locked" title="Requiere 2 o más artículos para redistribución">
                      <Lock size={10} /> 1 art.
                    </span>
                  )}
                </div>
              </th>

              {/* DHL: Editable cuando >= 2 artículos (prorrateado por peso físico) */}
              <th style={{ width: '12%' }}>
                <div className="th-cell-header">
                  <span>DHL (${totalDhlHandlingUSD.toFixed(0)})</span>
                  {canRedistribute ? (
                    <span className="th-badge-editable" title="Prorrateado por peso físico (lbs). Editable: al modificar un artículo, el saldo se redistribuye entre los demás conservando los $40 exactos.">
                      <SlidersHorizontal size={10} /> Peso (Ajust.)
                    </span>
                  ) : (
                    <span className="th-badge-locked" title="Prorrateado por peso físico (lbs). Requiere 2 o más artículos para redistribución">
                      <Lock size={10} /> Peso
                    </span>
                  )}
                </div>
              </th>

              <th style={{ width: '13%' }} className="highlight-th">Costo Unit. Bolivia</th>
              <th style={{ width: '12%' }} className="sale-th">Precio Venta Sug.</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item, index) => {
              const isExcluded = !!item.isExcluded;

              // Fila Oculta / Excluida en Tabla Final
              if (isExcluded) {
                const itemFobSubtotal = (item.quantity || 1) * (item.unitPriceUSD || 0);
                return (
                  <tr key={item.id} className="breakdown-row product-row-excluded">
                    <td style={{ textAlign: 'center' }}>
                      <label className="exclude-checkbox-label is-checked" title="Desmarcar box para incluir de nuevo en el cálculo">
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => onToggleExcludeProduct?.(item.id)}
                          className="exclude-checkbox-input"
                        />
                        <span className="exclude-custom-box is-checked">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      </label>
                    </td>
                    <td colSpan={7}>
                      <div className="excluded-row-content">
                        <div className="excluded-info-left">
                          <strong className="excluded-strikethrough-name">
                            {item.name || `Producto #${index + 1}`}
                          </strong>
                          <span className="excluded-chip">
                            <EyeOff size={11} /> Oculto del cálculo final
                          </span>
                        </div>
                        <div className="excluded-info-right">
                          <span className="excluded-meta-pill">
                            {item.quantity} ud • {formatUSD(itemFobSubtotal)} FOB • {(item.quantity * item.unitWeightLbs).toFixed(1)} lbs
                          </span>
                          <button
                            type="button"
                            className="btn-quick-reactivate"
                            onClick={() => onToggleExcludeProduct?.(item.id)}
                            title="Reactivar e incluir en el cálculo final"
                          >
                            <Eye size={12} /> Reactivar
                          </button>
                        </div>
                      </div>
                    </td>
                    <td></td>
                  </tr>
                );
              }

              // Fila Activa Calculada
              const calc = calculatedMap.get(item.id);
              if (!calc) return null;

              const qty = Math.max(1, calc.item.quantity || 1);
              const myusPerUnit = qty > 0 ? calc.proratedMyUSUSD / qty : 0;
              const taxesPerUnit = qty > 0 ? (calc.gaUSD + calc.ivaUSD) / qty : 0;
              const dhlPerUnit = qty > 0 ? calc.proratedDhlUSD / qty : 0;

              const isTaxCustom = !!calc.isTaxCustom;
              const isDhlCustom = !!calc.isDhlCustom;
              const maxTaxPerUnit = totalCustomsTaxesUSD > 0 ? totalCustomsTaxesUSD / qty : 99999;
              const maxDhlPerUnit = totalDhlHandlingUSD > 0 ? totalDhlHandlingUSD / qty : 40;

              return (
                <tr key={calc.item.id} className={`breakdown-row ${(isTaxCustom || isDhlCustom) ? 'row-customized' : ''}`}>
                  {/* Box Ocultar / Excluir */}
                  <td style={{ textAlign: 'center' }}>
                    <label className="exclude-checkbox-label" title="Marcar box para ocultar este producto y recalcular los costos con los restantes">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => onToggleExcludeProduct?.(calc.item.id)}
                        className="exclude-checkbox-input"
                      />
                      <span className="exclude-custom-box" />
                    </label>
                  </td>

                  {/* Producto y metadatos */}
                  <td>
                    <div className="product-item-cell">
                      <strong className="item-name">{calc.item.name || 'Sin nombre'}</strong>
                      <span className="item-sub">
                        {calc.item.sellerOrStore || 'eBay'} • {calc.totalWeightLbs.toFixed(1)} lbs ({calc.fobWeightRatio.toFixed(1)}% peso) • {calc.fobValueRatio.toFixed(1)}% valor
                      </span>
                    </div>
                  </td>

                  {/* Cantidad */}
                  <td style={{ textAlign: 'center' }}>
                    <span className="qty-tag">{calc.item.quantity}</span>
                  </td>

                  {/* FOB Unit */}
                  <td>
                    <div className="fob-cell">
                      <span>{formatUSD(calc.item.unitPriceUSD)}</span>
                    </div>
                  </td>

                  {/* Courier MyUS (MIXTO): Bloqueado por peso físico */}
                  <td>
                    <div className="sub-cost-cell courier-locked-cell">
                      <div className="cost-main-row">
                        <span className="cost-main">{formatUSD(myusPerUnit)}</span>
                        <span className="fixed-weight-pill" title="Vinculado al flete aéreo por peso físico (lbs)">
                          <Lock size={10} /> Peso
                        </span>
                      </div>
                      <span className="cost-sub">
                        {calc.proratedFreightUSD !== undefined 
                          ? `Flete: ${formatUSD(calc.proratedFreightUSD / qty)} + Seg.` 
                          : `Total: ${formatUSD(calc.proratedMyUSUSD)}`}
                      </span>
                    </div>
                  </td>

                  {/* Impuestos BO (GA + IVA): Editable con redistribución automática */}
                  <td>
                    {canRedistribute ? (
                      <div className={`sub-cost-cell editable-table-cell ${isTaxCustom ? 'is-custom' : hasTaxOverrides ? 'is-redistributed' : ''}`}>
                        <div className="cost-input-wrapper">
                          <span className="cost-currency-prefix">$</span>
                          <NumericInput
                            value={parseFloat(taxesPerUnit.toFixed(2))}
                            onValueChange={(val) => onUpdateTaxOverride?.(calc.item.id, val)}
                            min={0}
                            max={maxTaxPerUnit}
                            className={`table-cost-input ${isTaxCustom ? 'custom-input' : ''}`}
                            title={isTaxCustom ? "Valor personalizado manualmente" : "Valor calculado o redistribuido automáticamente"}
                          />
                          {isTaxCustom && onClearTaxOverride && (
                            <button
                              type="button"
                              className="btn-cell-revert"
                              title="Restablecer impuesto de este artículo al cálculo automático"
                              onClick={() => onClearTaxOverride(calc.item.id)}
                            >
                              <RotateCcw size={11} />
                            </button>
                          )}
                        </div>
                        <div className="cost-sub-row">
                          <span className="cost-sub">
                            GA ({calc.item.gaPercent}%): {formatUSD(calc.gaUSD / qty)} + IVA
                          </span>
                          {isTaxCustom ? (
                            <span className="badge-pill-manual">Manual</span>
                          ) : hasTaxOverrides ? (
                            <span className="badge-pill-auto">Redist.</span>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="sub-cost-cell" title="Se requieren 2 o más artículos para redistribuir costos">
                        <span className="cost-main">{formatUSD(taxesPerUnit)}</span>
                        <span className="cost-sub">
                          GA ({calc.item.gaPercent}%): {formatUSD(calc.gaUSD / qty)} + IVA
                        </span>
                      </div>
                    )}
                  </td>

                  {/* DHL ($40 s/ Peso): Editable con redistribución automática */}
                  <td>
                    {canRedistribute ? (
                      <div className={`sub-cost-cell editable-table-cell ${isDhlCustom ? 'is-custom' : hasDhlOverrides ? 'is-redistributed' : ''}`}>
                        <div className="cost-input-wrapper">
                          <span className="cost-currency-prefix">$</span>
                          <NumericInput
                            value={parseFloat(dhlPerUnit.toFixed(2))}
                            onValueChange={(val) => onUpdateDhlOverride?.(calc.item.id, val)}
                            min={0}
                            max={maxDhlPerUnit}
                            className={`table-cost-input ${isDhlCustom ? 'custom-input' : ''}`}
                            title={isDhlCustom ? "Valor personalizado manualmente" : "Valor prorrateado por peso físico o redistribuido automáticamente"}
                          />
                          {isDhlCustom && onClearDhlOverride && (
                            <button
                              type="button"
                              className="btn-cell-revert"
                              title="Restablecer DHL de este artículo al prorrateo automático por peso"
                              onClick={() => onClearDhlOverride(calc.item.id)}
                            >
                              <RotateCcw size={11} />
                            </button>
                          )}
                        </div>
                        <div className="cost-sub-row">
                          <span className="cost-sub">
                            {qty > 1 ? `Lote: ${formatUSD(calc.proratedDhlUSD)} • ${calc.fobWeightRatio.toFixed(1)}% peso` : `${calc.fobWeightRatio.toFixed(1)}% peso`}
                          </span>
                          {isDhlCustom ? (
                            <span className="badge-pill-manual">Manual</span>
                          ) : hasDhlOverrides ? (
                            <span className="badge-pill-auto">Redist.</span>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="sub-cost-cell" title="Prorrateado por peso físico. Se requieren 2 o más artículos para redistribuir costos">
                        <span className="cost-main">{formatUSD(dhlPerUnit)}</span>
                        <span className="cost-sub">{calc.fobWeightRatio.toFixed(1)}% peso</span>
                      </div>
                    )}
                  </td>

                  {/* Costo Unit. Bolivia */}
                  <td className={`landed-cost-cell ${(isTaxCustom || isDhlCustom) ? 'highlight-custom-landed' : ''}`}>
                    <div className="landed-badge">
                      {currencyMode !== 'bob' && (
                        <span className="landed-usd">{formatUSD(calc.unitLandedCostUSD)}</span>
                      )}
                      {currencyMode !== 'usd' && (
                        <span className="landed-bob">{formatBOB(calc.unitLandedCostBOB)}</span>
                      )}
                    </div>
                    <span className="total-lot-hint">
                      Lote: {currencyMode === 'usd' ? formatUSD(calc.totalLandedCostUSD) : currencyMode === 'bob' ? formatBOB(calc.totalLandedCostBOB) : `${formatUSD(calc.totalLandedCostUSD)} (${formatBOB(calc.totalLandedCostBOB)})`}
                    </span>
                  </td>

                  {/* Precio Venta Sugerido */}
                  <td className="suggested-sale-cell">
                    <div className="sale-badge">
                      {currencyMode !== 'bob' && (
                        <span className="sale-usd">{formatUSD(calc.suggestedSalePriceUSD)}</span>
                      )}
                      {currencyMode !== 'usd' && (
                        <span className="sale-bob">{formatBOB(calc.suggestedSalePriceBOB)}</span>
                      )}
                    </div>
                    <div className="profit-margin-row">
                      <span className="margin-pill">+{calc.item.targetMarginPercent}%</span>
                      <span className="profit-text">
                        Ganancia: {currencyMode === 'usd' ? `+${formatUSD(calc.unitProfitUSD)}` : `+${formatBOB(calc.unitProfitBOB)}`}/ud
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          BARRA DE ACCIONES Y RESTAURACIÓN DE CÁLCULO ORIGINAL
         ========================================================================= */}
      <div className="breakdown-actions-bar">
        <div className="actions-bar-info">
          {excludedCount > 0 ? (
            <div className="status-chip active">
              <EyeOff size={15} className="text-amber" />
              <span>
                <strong>Simulación Activa:</strong> {excludedCount} artículo{excludedCount > 1 ? 's' : ''} oculto{excludedCount > 1 ? 's' : ''}. Los cálculos reflejan la importación de los {products.length} artículos vigentes.
              </span>
            </div>
          ) : hasAnyOverrides ? (
            <div className="status-chip active">
              <Sparkles size={15} className="text-amber" />
              <span>
                <strong>Redistribución activa:</strong> Los impuestos o DHL se han redistribuido automáticamente. El costo consolidado total de la importación se conserva exactamente.
              </span>
            </div>
          ) : canRedistribute ? (
            <div className="status-chip ready">
              <CheckCircle2 size={15} className="text-cyan" />
              <span>
                <strong>Prorrateo estándar:</strong> Modifica el valor en la columna <strong>Impuestos Bo</strong> o <strong>DHL</strong> de cualquier fila para redistribuir costos según tu criterio comercial.
              </span>
            </div>
          ) : (
            <div className="status-chip single-item">
              <Info size={15} className="text-muted" />
              <span>
                La redistribución dinámica de costos se activará automáticamente cuando haya <strong>2 o más artículos activos</strong>.
              </span>
            </div>
          )}
        </div>

        {/* Botón para devolver al estado original del cálculo */}
        <button
          type="button"
          className={`btn-reset-proration ${hasAnyOverrides ? 'is-active' : 'is-disabled'}`}
          onClick={onResetAllOverrides}
          disabled={!hasAnyOverrides}
          title={hasAnyOverrides ? "Restablecer todos los impuestos y montos DHL a sus valores de prorrateo original" : "El cálculo ya se encuentra en su estado original"}
        >
          <RotateCcw size={15} />
          <span>Devolver al estado original del cálculo</span>
        </button>
      </div>

      {/* Leyenda y notas al pie */}
      <div className="breakdown-footer-info">
        <div className="footer-legend-item">
          <Scale size={14} className="text-accent" />
          <span>
            <strong>Prorrateo Mixto Inteligente:</strong> El Flete Courier y la Tasa fija de DHL ($40) se distribuyen por <strong>Peso físico (lbs)</strong> (manejo y manipulación logística real), mientras que el Seguro MyUS y los Impuestos se calculan sobre <strong>Valor comercial FOB / CIF ($)</strong>.
          </span>
        </div>
        <div className="footer-legend-item">
          <TrendingUp size={14} className="text-emerald" />
          <span>El precio sugerido incluye la cobertura de todos los costos desembarcados recalculados más el margen deseado.</span>
        </div>
      </div>
    </div>
  );
};
