import React from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  ShoppingBag, 
  Scale, 
  Tag,
  Eye,
  EyeOff,
  Check,
  RotateCcw
} from 'lucide-react';
import type { ProductItem } from '../types/calculator';
import { BOLIVIA_TARIFF_CATEGORIES, LBS_TO_KG } from '../utils/calculatorEngine';
import { formatUSD, formatBOB } from '../utils/formatters';
import { NumericInput } from './NumericInput';

interface ProductsSectionProps {
  products: ProductItem[];
  exchangeRate: number;
  currencyMode: 'both' | 'usd' | 'bob';
  onAddProduct: () => void;
  onUpdateProduct: (id: string, updates: Partial<ProductItem>) => void;
  onRemoveProduct: (id: string) => void;
  onDuplicateProduct: (id: string) => void;
  onToggleExcludeProduct: (id: string) => void;
  onRestoreAllProducts: () => void;
}

export const ProductsSection: React.FC<ProductsSectionProps> = ({
  products,
  exchangeRate,
  onAddProduct,
  onUpdateProduct,
  onRemoveProduct,
  onDuplicateProduct,
  onToggleExcludeProduct,
  onRestoreAllProducts
}) => {
  const currentRate = exchangeRate || 12.26;
  const activeProducts = products.filter(p => !p.isExcluded);
  const excludedProducts = products.filter(p => !!p.isExcluded);
  const excludedCount = excludedProducts.length;

  const totalFobUSD = activeProducts.reduce((acc, p) => acc + (p.quantity * p.unitPriceUSD || 0), 0);
  const totalFobBOB = totalFobUSD * currentRate;
  const totalWeightLbs = activeProducts.reduce((acc, p) => acc + (p.quantity * p.unitWeightLbs || 0), 0);
  const totalWeightKg = totalWeightLbs * LBS_TO_KG;
  const totalItems = activeProducts.reduce((acc, p) => acc + (p.quantity || 0), 0);

  return (
    <div className="section-card">
      <div className="section-card-header">
        <div className="section-title-wrap">
          <div className="section-icon-badge bag-badge">
            <ShoppingBag size={20} />
          </div>
          <div>
            <div className="section-title-row">
              <h2 className="section-title">1. Compras en eBay / Tiendas USA (Valor FOB)</h2>
              {excludedCount > 0 && (
                <span className="section-status-chip sim-chip">
                  <EyeOff size={13} />
                  Simulación activa: {excludedCount} oculto{excludedCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="section-subtitle">
              Ingresa los productos comprados. Marca la casilla <strong>Ocultar</strong> en cualquier fila para simular cómo varía la importación sin ese producto.
            </p>
          </div>
        </div>

        <div className="section-header-actions">
          {excludedCount > 0 && (
            <button
              type="button"
              className="action-btn secondary-btn"
              onClick={onRestoreAllProducts}
              title="Restaurar todos los productos excluidos"
            >
              <RotateCcw size={15} />
              <span>Restaurar todos ({products.length})</span>
            </button>
          )}

          <button 
            type="button" 
            className="action-btn primary-btn"
            onClick={onAddProduct}
          >
            <Plus size={16} />
            <span>Agregar Producto</span>
          </button>
        </div>
      </div>

      {/* Banner de Notificación de Simulación What-If */}
      {excludedCount > 0 && (
        <div className="simulation-notice-bar">
          <div className="simulation-notice-left">
            <div className="simulation-pulse-icon">
              <EyeOff size={15} />
            </div>
            <div className="simulation-notice-text">
              <strong>Simulación What-If Activa:</strong> Se {excludedCount === 1 ? 'ha ocultado 1 producto' : `han ocultado ${excludedCount} productos`} del cálculo ({activeProducts.length} restantes activos). Todo el proceso logístico y arancelario se recalcula con los productos vigentes.
            </div>
          </div>
          <button
            type="button"
            className="btn-restore-all-simulation"
            onClick={onRestoreAllProducts}
          >
            <RotateCcw size={13} />
            <span>Restaurar todos ({products.length})</span>
          </button>
        </div>
      )}

      {products.length === 0 ? (
        <div className="empty-state-box">
          <ShoppingBag size={42} className="empty-icon" />
          <h4>No hay productos en la lista</h4>
          <p>Comienza agregando los artículos comprados en eBay u otra tienda de USA.</p>
          <button type="button" className="action-btn primary-btn mt-2" onClick={onAddProduct}>
            <Plus size={16} /> Agregar Primer Producto
          </button>
        </div>
      ) : (
        <>
          {/* =========================================================================
              DESKTOP VIEW: Tabla Completa de Productos (Visible en pantallas >= 769px)
              ========================================================================= */}
          <div className="table-responsive-container desktop-products-table-container">
            <table className="custom-data-table">
              <thead>
                <tr>
                  <th style={{ width: '6%', textAlign: 'center' }} title="Marcar box para ocultar este producto y recalcular los costos con los restantes">
                    <div className="th-center-wrap">
                      <span>Ocultar</span>
                    </div>
                  </th>
                  <th style={{ width: '25%' }}>Producto / Descripción</th>
                  <th style={{ width: '9%' }}>Cant.</th>
                  <th style={{ width: '13%' }}>Precio FOB Unit.</th>
                  <th style={{ width: '13%' }}>Peso Unit.</th>
                  <th style={{ width: '18%' }}>Categoría / GA % (Bolivia)</th>
                  <th style={{ width: '9%' }}>Margen %</th>
                  <th style={{ width: '7%', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item, index) => {
                  const qty = item.quantity || 1;
                  const price = item.unitPriceUSD || 0;
                  const weight = item.unitWeightLbs || 0;
                  const subtotalUSD = qty * price;
                  const itemTotalWeightLbs = qty * weight;
                  const isExcluded = !!item.isExcluded;

                  // Fila oculta / excluida de simulación
                  if (isExcluded) {
                    return (
                      <tr key={item.id} className="product-row product-row-excluded">
                        <td style={{ textAlign: 'center' }}>
                          <label className="exclude-checkbox-label is-checked" title="Desmarcar box para incluir de nuevo en el cálculo">
                            <input
                              type="checkbox"
                              checked={true}
                              onChange={() => onToggleExcludeProduct(item.id)}
                              className="exclude-checkbox-input"
                            />
                            <span className="exclude-custom-box is-checked">
                              <Check size={12} strokeWidth={3} />
                            </span>
                          </label>
                        </td>
                        <td colSpan={6}>
                          <div className="excluded-row-content">
                            <div className="excluded-info-left">
                              <span className="excluded-strikethrough-name">
                                {item.name || `Producto #${index + 1}`}
                              </span>
                              <span className="excluded-chip">
                                <EyeOff size={11} /> Oculto del cálculo
                              </span>
                            </div>
                            <div className="excluded-info-right">
                              <span className="excluded-meta-pill">
                                {qty} ud{qty > 1 ? 's' : ''} • {formatUSD(subtotalUSD)} FOB • {itemTotalWeightLbs.toFixed(1)} lbs
                              </span>
                              <button
                                type="button"
                                className="btn-quick-reactivate"
                                onClick={() => onToggleExcludeProduct(item.id)}
                                title="Reactivar e incluir en el cálculo"
                              >
                                <Eye size={12} /> Reactivar
                              </button>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="row-actions justify-center">
                            <button
                              type="button"
                              className="row-action-btn delete-btn"
                              title="Eliminar producto definitivamente"
                              onClick={() => onRemoveProduct(item.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  // Fila normal activa
                  return (
                    <tr key={item.id} className="product-row">
                      {/* Box Ocultar / Excluir */}
                      <td style={{ textAlign: 'center' }}>
                        <label className="exclude-checkbox-label" title="Marcar box para ocultar este producto y recalcular con los restantes">
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => onToggleExcludeProduct(item.id)}
                            className="exclude-checkbox-input"
                          />
                          <span className="exclude-custom-box" />
                        </label>
                      </td>

                      <td>
                        <div className="product-input-name-wrap">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => onUpdateProduct(item.id, { name: e.target.value })}
                            placeholder={`Ej. Producto #${index + 1}`}
                            className="table-input item-name-input"
                          />
                          <div className="store-pill-row">
                            <input
                              type="text"
                              value={item.sellerOrStore}
                              onChange={(e) => onUpdateProduct(item.id, { sellerOrStore: e.target.value })}
                              placeholder="Tienda / Vendedor (eBay)"
                              className="table-input store-name-input"
                            />

                            <label className="battery-checkbox-chip" title="Marca si este artículo contiene batería de litio (activa sticker MyUS de $8 USD)">
                              <input
                                type="checkbox"
                                checked={!!item.hasLithiumBattery}
                                onChange={(e) => onUpdateProduct(item.id, { hasLithiumBattery: e.target.checked })}
                              />
                              <span>🔋 Litio</span>
                            </label>
                          </div>
                        </div>
                      </td>

                      <td>
                        <NumericInput
                          min={1}
                          fallbackOnBlur={1}
                          allowDecimals={false}
                          value={item.quantity}
                          onValueChange={(val) => onUpdateProduct(item.id, { quantity: val })}
                          className="table-input number-input text-center"
                          placeholder="1"
                        />
                      </td>

                      <td>
                        <div className="input-with-currency">
                          <span className="currency-symbol">$</span>
                          <NumericInput
                            min={0}
                            fallbackOnBlur={0}
                            allowDecimals={true}
                            value={item.unitPriceUSD}
                            onValueChange={(val) => onUpdateProduct(item.id, { unitPriceUSD: val })}
                            className="table-input price-input"
                            placeholder="0.00"
                          />
                        </div>
                        <div className="subtotal-hint">
                          Subtotal: {formatUSD(subtotalUSD)}
                        </div>
                      </td>

                      <td>
                        <div className="input-with-currency">
                          <NumericInput
                            min={0}
                            fallbackOnBlur={0}
                            allowDecimals={true}
                            value={item.unitWeightLbs}
                            onValueChange={(val) => onUpdateProduct(item.id, { unitWeightLbs: val })}
                            className="table-input weight-input"
                            placeholder="0.0"
                          />
                          <span className="unit-symbol">lbs</span>
                        </div>
                        <div className="weight-hint">
                          ≈ {(weight * LBS_TO_KG).toFixed(2)} kg
                          {qty > 1 && ` (Total: ${itemTotalWeightLbs.toFixed(1)} lbs)`}
                        </div>
                      </td>

                      <td>
                        <div className="tariff-selector-wrap">
                          <select
                            value={item.category}
                            onChange={(e) => {
                              const selectedCat = BOLIVIA_TARIFF_CATEGORIES.find(c => c.value === e.target.value);
                              if (selectedCat && selectedCat.value !== 'custom') {
                                onUpdateProduct(item.id, { 
                                  category: selectedCat.value, 
                                  gaPercent: selectedCat.ga 
                                });
                              } else {
                                onUpdateProduct(item.id, { category: 'custom' });
                              }
                            }}
                            className="table-select tariff-select"
                          >
                            {BOLIVIA_TARIFF_CATEGORIES.map(cat => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                          
                          <div className="ga-input-badge-row">
                            <span className="ga-label">GA Bolivia:</span>
                            <div className="ga-field-wrapper">
                              <NumericInput
                                min={0}
                                max={100}
                                fallbackOnBlur={0}
                                allowDecimals={false}
                                value={item.gaPercent}
                                onValueChange={(val) => onUpdateProduct(item.id, { gaPercent: val })}
                                className="ga-percent-input"
                                placeholder="0"
                              />
                              <span className="percent-symbol">%</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="margin-input-wrap">
                          <div className="input-with-currency">
                            <NumericInput
                              min={0}
                              max={500}
                              fallbackOnBlur={0}
                              allowDecimals={false}
                              value={item.targetMarginPercent}
                              onValueChange={(val) => onUpdateProduct(item.id, { targetMarginPercent: val })}
                              className="table-input margin-input"
                              placeholder="30"
                            />
                            <span className="unit-symbol">%</span>
                          </div>
                        </div>
                        <span className="margin-hint">utilidad</span>
                      </td>

                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="row-action-btn copy-btn"
                            title="Duplicar producto"
                            onClick={() => onDuplicateProduct(item.id)}
                          >
                            <Copy size={15} />
                          </button>
                          <button
                            type="button"
                            className="row-action-btn delete-btn"
                            title="Eliminar producto"
                            onClick={() => onRemoveProduct(item.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* =========================================================================
              MOBILE VIEW: Tarjetas de Producto Nativas para Celulares (<= 768px)
              ========================================================================= */}
          <div className="mobile-products-cards-container">
            {products.map((item, index) => {
              const qty = item.quantity || 1;
              const price = item.unitPriceUSD || 0;
              const weight = item.unitWeightLbs || 0;
              const subtotalUSD = qty * price;
              const itemTotalWeightLbs = qty * weight;
              const itemTotalWeightKg = itemTotalWeightLbs * LBS_TO_KG;
              const isExcluded = !!item.isExcluded;

              // Tarjeta compacta móvil para producto excluido
              if (isExcluded) {
                return (
                  <div key={item.id} className="mobile-product-card mobile-card-excluded">
                    <div className="mobile-excluded-inner">
                      <div className="mobile-excluded-left">
                        <label className="exclude-checkbox-label is-checked" title="Desmarcar box para reactivar">
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => onToggleExcludeProduct(item.id)}
                            className="exclude-checkbox-input"
                          />
                          <span className="exclude-custom-box is-checked">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        </label>
                        <div>
                          <span className="mobile-excluded-title">{item.name || `Ítem #${index + 1}`}</span>
                          <span className="mobile-excluded-sub">Oculto del recálculo • {formatUSD(subtotalUSD)}</span>
                        </div>
                      </div>
                      <div className="mobile-excluded-actions">
                        <button
                          type="button"
                          className="btn-quick-reactivate"
                          onClick={() => onToggleExcludeProduct(item.id)}
                        >
                          <Eye size={12} /> Reactivar
                        </button>
                        <button
                          type="button"
                          className="row-action-btn delete-btn"
                          onClick={() => onRemoveProduct(item.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Tarjeta móvil activa
              return (
                <div key={item.id} className="mobile-product-card">
                  {/* Header de la tarjeta */}
                  <div className="mobile-card-header">
                    <div className="mobile-card-tag">
                      <span className="mobile-card-badge">Ítem #{index + 1}</span>
                      {subtotalUSD > 0 && (
                        <span className="mobile-card-fob-tag">{formatUSD(subtotalUSD)}</span>
                      )}
                      <label className="mobile-exclude-chip" title="Marcar box para ocultar de la simulación">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => onToggleExcludeProduct(item.id)}
                        />
                        <span>👁️ Ocultar</span>
                      </label>
                    </div>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="row-action-btn copy-btn"
                        title="Duplicar producto"
                        onClick={() => onDuplicateProduct(item.id)}
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        type="button"
                        className="row-action-btn delete-btn"
                        title="Eliminar producto"
                        onClick={() => onRemoveProduct(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Nombre del Producto */}
                  <div className="mobile-field-group">
                    <label className="mobile-field-label">Nombre del Producto / Descripción</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => onUpdateProduct(item.id, { name: e.target.value })}
                      placeholder={`Ej. Dispositivo #${index + 1}`}
                      className="table-input item-name-input"
                    />
                  </div>

                  {/* Tienda y Litio */}
                  <div className="mobile-store-row">
                    <div className="mobile-field-group flex-1">
                      <label className="mobile-field-label">Tienda / Origen</label>
                      <input
                        type="text"
                        value={item.sellerOrStore}
                        onChange={(e) => onUpdateProduct(item.id, { sellerOrStore: e.target.value })}
                        placeholder="eBay / Amazon / USA"
                        className="table-input store-name-input"
                      />
                    </div>

                    <label className="battery-checkbox-chip mobile-battery-chip" title="Marca si este artículo contiene batería de litio (activa sticker MyUS de $8 USD)">
                      <input
                        type="checkbox"
                        checked={!!item.hasLithiumBattery}
                        onChange={(e) => onUpdateProduct(item.id, { hasLithiumBattery: e.target.checked })}
                      />
                      <span>🔋 Litio ($8)</span>
                    </label>
                  </div>

                  {/* Grid 2x2 para Cantidad, Precio FOB, Peso Unitario y Margen */}
                  <div className="mobile-numbers-grid">
                    {/* Cantidad */}
                    <div className="mobile-field-group">
                      <label className="mobile-field-label">Cantidad</label>
                      <NumericInput
                        min={1}
                        fallbackOnBlur={1}
                        allowDecimals={false}
                        value={item.quantity}
                        onValueChange={(val) => onUpdateProduct(item.id, { quantity: val })}
                        className="table-input number-input text-center"
                        placeholder="1"
                      />
                    </div>

                    {/* Precio FOB Unitario */}
                    <div className="mobile-field-group">
                      <label className="mobile-field-label">Precio Unit. (FOB)</label>
                      <div className="input-with-currency">
                        <span className="currency-symbol">$</span>
                        <NumericInput
                          min={0}
                          fallbackOnBlur={0}
                          allowDecimals={true}
                          value={item.unitPriceUSD}
                          onValueChange={(val) => onUpdateProduct(item.id, { unitPriceUSD: val })}
                          className="table-input price-input"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="subtotal-hint">
                        Subtotal: {formatUSD(subtotalUSD)}
                      </div>
                    </div>

                    {/* Peso Unitario en Libras */}
                    <div className="mobile-field-group">
                      <label className="mobile-field-label">Peso Unitario</label>
                      <div className="input-with-currency">
                        <NumericInput
                          min={0}
                          fallbackOnBlur={0}
                          allowDecimals={true}
                          value={item.unitWeightLbs}
                          onValueChange={(val) => onUpdateProduct(item.id, { unitWeightLbs: val })}
                          className="table-input weight-input"
                          placeholder="0.0"
                        />
                        <span className="unit-symbol">lbs</span>
                      </div>
                      <div className="weight-hint">
                        ≈ {(weight * LBS_TO_KG).toFixed(2)} kg
                        {qty > 1 && ` • Tot: ${itemTotalWeightLbs.toFixed(1)} lbs`}
                      </div>
                    </div>

                    {/* Margen de Utilidad % */}
                    <div className="mobile-field-group">
                      <label className="mobile-field-label">Margen Utilidad</label>
                      <div className="input-with-currency">
                        <NumericInput
                          min={0}
                          max={500}
                          fallbackOnBlur={0}
                          allowDecimals={false}
                          value={item.targetMarginPercent}
                          onValueChange={(val) => onUpdateProduct(item.id, { targetMarginPercent: val })}
                          className="table-input margin-input"
                          placeholder="30"
                        />
                        <span className="unit-symbol">%</span>
                      </div>
                      <span className="margin-hint">Utilidad sobre costo</span>
                    </div>
                  </div>

                  {/* Categoría y GA Bolivia */}
                  <div className="mobile-field-group mt-2">
                    <label className="mobile-field-label">Categoría & Gravamen Arancelario (GA Bolivia)</label>
                    <div className="tariff-selector-wrap">
                      <select
                        value={item.category}
                        onChange={(e) => {
                          const selectedCat = BOLIVIA_TARIFF_CATEGORIES.find(c => c.value === e.target.value);
                          if (selectedCat && selectedCat.value !== 'custom') {
                            onUpdateProduct(item.id, { 
                              category: selectedCat.value, 
                              gaPercent: selectedCat.ga 
                            });
                          } else {
                            onUpdateProduct(item.id, { category: 'custom' });
                          }
                        }}
                        className="table-select tariff-select"
                      >
                        {BOLIVIA_TARIFF_CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      
                      <div className="ga-input-badge-row">
                        <span className="ga-label">GA Bolivia aplicable:</span>
                        <div className="ga-field-wrapper">
                          <NumericInput
                            min={0}
                            max={100}
                            fallbackOnBlur={0}
                            allowDecimals={false}
                            value={item.gaPercent}
                            onValueChange={(val) => onUpdateProduct(item.id, { gaPercent: val })}
                            className="ga-percent-input"
                            placeholder="0"
                          />
                          <span className="percent-symbol">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subtotal del Producto Footer */}
                  <div className="mobile-card-footer">
                    <div className="footer-summary-sub">
                      <span>FOB Total: <strong>{formatUSD(subtotalUSD)}</strong></span>
                      <span>Peso Total: <strong>{itemTotalWeightLbs.toFixed(1)} lbs ({itemTotalWeightKg.toFixed(2)} kg)</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Summary Footer Bar for Products */}
      <div className="products-summary-strip">
        <div className="summary-stat-chip">
          <Tag size={15} className="chip-icon" />
          <span className="chip-title">Total Artículos:</span>
          <strong>{totalItems} uds. ({activeProducts.length} activos)</strong>
        </div>

        <div className="summary-stat-chip">
          <Scale size={15} className="chip-icon" />
          <span className="chip-title">Peso Total:</span>
          <strong>{totalWeightLbs.toFixed(2)} lbs <span className="text-muted">({totalWeightKg.toFixed(2)} kg)</span></strong>
        </div>

        <div className="summary-stat-chip highlight-chip">
          <ShoppingBag size={15} className="chip-icon" />
          <span className="chip-title">Total FOB Compras:</span>
          <div className="fob-total-display">
            <strong>{formatUSD(totalFobUSD)}</strong>
            <span className="fob-bob-sub">({formatBOB(totalFobBOB)})</span>
          </div>
        </div>

        {excludedCount > 0 && (
          <div className="summary-stat-chip sim-active-chip">
            <EyeOff size={15} className="chip-icon text-amber" />
            <span className="chip-title">Simulación:</span>
            <strong>{excludedCount} excluido{excludedCount > 1 ? 's' : ''}</strong>
          </div>
        )}
      </div>
    </div>
  );
};
