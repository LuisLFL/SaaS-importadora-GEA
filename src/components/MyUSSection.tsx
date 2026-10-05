import React from 'react';
import { 
  Package, 
  BatteryCharging, 
  AlertTriangle, 
  ShieldCheck, 
  Crown, 
  Info,
  Percent,
  DollarSign,
  Check,
  Clock,
  Sparkles,
  Tag,
  AlertCircle
} from 'lucide-react';
import type { MyUSConfig, MyUSShippingMethod } from '../types/calculator';
import { MYUS_SHIPPING_OPTIONS, getAllCarrierRates } from '../utils/calculatorEngine';
import { formatUSD, formatBOB } from '../utils/formatters';

interface MyUSSectionProps {
  myusConfig: MyUSConfig;
  totalWeightLbs: number;
  totalFobUSD: number;
  exchangeRate: number;
  totalPackagesCount?: number;
  onUpdateMyUS: (updates: Partial<MyUSConfig>) => void;
}

export const MyUSSection: React.FC<MyUSSectionProps> = ({
  myusConfig,
  totalWeightLbs,
  totalFobUSD,
  exchangeRate,
  totalPackagesCount = 1,
  onUpdateMyUS
}) => {
  const selectedMethod: MyUSShippingMethod = myusConfig.shippingMethod || 'dhl_smallbox';
  // Redondeo obligatorio al próximo entero superior según norma courier de MyUS (ej. 4.75 lbs -> 5 lbs)
  const billableWeightLbs = totalWeightLbs > 0 ? Math.max(1, Math.ceil(totalWeightLbs)) : 0;
  const allCarrierRates = getAllCarrierRates(billableWeightLbs);
  const activeMethodMeta = MYUS_SHIPPING_OPTIONS.find(o => o.id === selectedMethod) || MYUS_SHIPPING_OPTIONS[0];

  // 1. Flete Base MyUS (según método seleccionado o manual)
  const autoRateForSelected = allCarrierRates[selectedMethod] || 0;
  const baseShippingCharge = myusConfig.autoCalculateShipping 
    ? autoRateForSelected 
    : (myusConfig.shippingChargeUSD || 0);

  // 1.1 Descuentos de Flete MyUS
  // a) Descuento Porcentual (% sobre flete base)
  const discountPercent = Math.min(100, Math.max(0, myusConfig.discountPercent || 0));
  const discountPercentAmount = parseFloat((baseShippingCharge * (discountPercent / 100)).toFixed(2));
  const afterPercentAmount = Math.max(0, baseShippingCharge - discountPercentAmount);

  // b) Descuento en Crédito USD (crédito fijo de cuenta)
  const discountCreditRaw = Math.max(0, myusConfig.discountCreditUSD || 0);
  const discountCreditAmount = parseFloat(Math.min(afterPercentAmount, discountCreditRaw).toFixed(2));

  // c) Sumatoria de descuentos y Flete Neto resultante
  const totalDiscountAmount = parseFloat((discountPercentAmount + discountCreditAmount).toFixed(2));
  const netShippingCharge = parseFloat(Math.max(0, baseShippingCharge - totalDiscountAmount).toFixed(2));

  // 2. Shipping Preferences (Seguro: $3.50 por cada $100 FOB)
  const insuranceTiers = totalFobUSD > 0 ? Math.ceil(totalFobUSD / 100) : 1;
  const calculatedInsurance = parseFloat((insuranceTiers * (myusConfig.insurancePer100RateUSD || 3.50)).toFixed(2));
  const activePreferencesCharge = myusConfig.useCustomShippingPreferences
    ? (myusConfig.customShippingPreferencesUSD || 0)
    : calculatedInsurance;

  // 3. Package Level Charges ($8.99 por casillero/suite no identificada)
  const activePackageLevelCharge = myusConfig.hasPackageLevelCharges 
    ? (myusConfig.packageLevelChargesUSD || 8.99) 
    : 0;

  // 4. Lithium-ion Stickers ($8.00)
  const activeLithiumCharge = myusConfig.hasLithiumSticker 
    ? (myusConfig.lithiumStickerUSD || 8.00) 
    : 0;

  // 5. Consolidación
  const isPremium = myusConfig.membershipType === 'premium';
  const consolidationFee = isPremium ? 0 : (myusConfig.consolidationFeeUSD || 3.00);

  // Gran Total MyUS (Factura Courier que compone el CIF en Bolivia)
  const totalMyUSUSD = netShippingCharge + 
    activePreferencesCharge + 
    activePackageLevelCharge + 
    activeLithiumCharge + 
    consolidationFee;

  const totalMyUSBOB = totalMyUSUSD * exchangeRate;

  // Presets para descuento porcentual
  const percentPresets = [
    { label: '0%', value: 0 },
    { label: '10%', value: 10 },
    { label: '15% (Visa/MC)', value: 15 },
    { label: '20% (Promo)', value: 20 },
    { label: '30%', value: 30 }
  ];

  // Presets para crédito en USD
  const creditPresets = [
    { label: '$0', value: 0 },
    { label: '$5', value: 5 },
    { label: '$10', value: 10 },
    { label: '$15', value: 15 },
    { label: '$20', value: 20 }
  ];

  return (
    <div className="section-card myus-card">
      {/* Header Principal de la Sección */}
      <div className="section-card-header">
        <div className="section-title-wrap">
          <div className="section-icon-badge myus-badge">
            <Package size={20} />
          </div>
          <div>
            <div className="myus-title-row">
              <h2 className="section-title">2. Costos de Courier Internacional (MyUS)</h2>
              <span className="myus-tag">Ship Request Summary</span>
            </div>
            <p className="section-subtitle">
              Configura el método de envío, aplica descuentos promocionales y visualiza el desglose exacto facturado por MyUS.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BLOQUE A: SELECTOR DE OPCIONES DE ENVÍO DE MYUS (CARRIER OPTIONS)
         ========================================================================= */}
      <div className="shipping-options-container">
        <div className="shipping-options-header">
          <div>
            <div className="shipping-options-title-row">
              <h3 className="sub-box-title">Opciones de Envío MyUS a Bolivia</h3>
              <span className="based-weight-badge">
                Tarifas para {billableWeightLbs} lbs {totalWeightLbs > 0 && totalWeightLbs !== billableWeightLbs ? `(${totalWeightLbs.toFixed(2)} lbs reales redondeadas)` : ''}
              </span>
            </div>
            <p className="sub-box-desc">
              Compara las alternativas de flete oficiales según peso TruePrice™ (redondeo al entero superior), tiempos de tránsito y consolidación.
            </p>
          </div>
        </div>

        <div className="carrier-cards-grid">
          {MYUS_SHIPPING_OPTIONS.map((option) => {
            const isSelected = selectedMethod === option.id;
            const carrierRate = allCarrierRates[option.id];

            // Validaciones y alertas de límites
            const exceedsWeight = option.maxWeightLbs && billableWeightLbs > option.maxWeightLbs;
            const exceedsPackages = option.packageLimit && option.packageLimit === 1 && totalPackagesCount > 1;
            const exceedsFob = option.maxMerchandiseUSD && totalFobUSD > option.maxMerchandiseUSD;
            const hasAnyWarning = exceedsWeight || exceedsPackages || exceedsFob;

            return (
              <div
                key={option.id}
                className={`carrier-card ${isSelected ? 'active-carrier-card' : ''} ${hasAnyWarning ? 'carrier-warning-border' : ''}`}
                onClick={() => {
                  onUpdateMyUS({ 
                    shippingMethod: option.id,
                    autoCalculateShipping: true,
                    shippingChargeUSD: carrierRate
                  });
                }}
              >
                {/* Cabecera de la Tarjeta del Carrier */}
                <div className="carrier-card-top">
                  <div className="carrier-badge-row">
                    <span className={`carrier-brand-pill ${option.carrierCode}`}>
                      {option.carrier}
                    </span>
                    {option.isBestValue && (
                      <span className="best-value-pill">
                        <Sparkles size={11} />
                        BEST VALUE
                      </span>
                    )}
                    {option.badgeText && !option.isBestValue && (
                      <span className="carrier-feature-pill">
                        {option.badgeText}
                      </span>
                    )}
                  </div>

                  <div className="carrier-selection-indicator">
                    {isSelected ? (
                      <span className="selected-radio-circle active">
                        <Check size={13} />
                      </span>
                    ) : (
                      <span className="selected-radio-circle" />
                    )}
                  </div>
                </div>

                {/* Nombre y Tiempo de Tránsito */}
                <div className="carrier-info-body">
                  <h4 className="carrier-name">{option.name}</h4>
                  <div className="carrier-transit-row">
                    <Clock size={13} className="transit-icon" />
                    <span className="transit-text">{option.transitDays} hábiles</span>
                  </div>
                  <p className="carrier-short-desc">{option.description}</p>
                </div>

                {/* Avisos de Restricción si aplican */}
                {hasAnyWarning && (
                  <div className="carrier-warnings-box">
                    {exceedsWeight && (
                      <span className="carrier-warning-chip">
                        <AlertCircle size={11} />
                        Excede límite de {option.maxWeightLbs} lbs (tienes {totalWeightLbs.toFixed(1)} lbs)
                      </span>
                    )}
                    {exceedsPackages && (
                      <span className="carrier-warning-chip">
                        <AlertCircle size={11} />
                        No consolidable (tienes {totalPackagesCount} paquetes)
                      </span>
                    )}
                    {exceedsFob && (
                      <span className="carrier-warning-chip">
                        <AlertCircle size={11} />
                        FOB supera máx. ${option.maxMerchandiseUSD} USD
                      </span>
                    )}
                  </div>
                )}

                {/* Precio del Carrier */}
                <div className="carrier-card-footer">
                  <div className="carrier-price-block">
                    <span className="carrier-price-label">Flete Base MyUS:</span>
                    <span className="carrier-price-amount">{formatUSD(carrierRate)}</span>
                  </div>
                  <button 
                    type="button" 
                    className={`carrier-select-btn ${isSelected ? 'selected' : ''}`}
                  >
                    {isSelected ? 'Seleccionado' : 'Elegir Opción'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          BLOQUE B: DESCUENTOS Y PROMOCIONES (PORCENTUAL Y CRÉDITO USD)
         ========================================================================= */}
      <div className="discounts-config-box">
        <div className="discounts-box-header">
          <div className="discounts-title-group">
            <div className="discounts-icon-badge">
              <Tag size={16} />
            </div>
            <div>
              <h3 className="sub-box-title">Descuentos y Beneficios de Envío MyUS</h3>
              <p className="sub-box-desc">
                Reduce el flete base mediante convenios de tarjetas (Visa/Mastercard 15-20% OFF) o cupones de crédito en dólares.
              </p>
            </div>
          </div>

          {totalDiscountAmount > 0 && (
            <div className="savings-badge-pill">
              <Sparkles size={13} className="text-emerald" />
              <span>Ahorro total: <strong>-{formatUSD(totalDiscountAmount)}</strong></span>
            </div>
          )}
        </div>

        <div className="discounts-grid-two-col">
          {/* Opción 1: Descuento Porcentual (%) */}
          <div className="discount-card">
            <div className="discount-card-header">
              <div className="discount-card-title-wrap">
                <Percent size={15} className="text-cyan" />
                <span className="discount-card-label">1. Descuento Porcentual (%)</span>
              </div>
              <span className="discount-card-sub">
                {discountPercentAmount > 0 ? (
                  <strong className="text-emerald">-{formatUSD(discountPercentAmount)}</strong>
                ) : (
                  <span className="text-muted">$0.00</span>
                )}
              </span>
            </div>
            <p className="discount-card-help">
              Convenios bancarios (ej. 15% o 20% OFF MyUS con Visa/Mastercard) o cupones promocionales.
            </p>

            {/* Presets Rápidos */}
            <div className="discount-presets-row">
              {percentPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={`discount-preset-btn ${discountPercent === preset.value ? 'active' : ''}`}
                  onClick={() => onUpdateMyUS({ discountPercent: preset.value })}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Input Manual de Porcentaje */}
            <div className="discount-input-row">
              <label className="discount-input-label">Porcentaje personalizado:</label>
              <div className="input-with-currency small-pill-input">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={discountPercent || ''}
                  onChange={(e) => {
                    const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                    onUpdateMyUS({ discountPercent: val });
                  }}
                  placeholder="0"
                  className="table-input text-right"
                />
                <span className="unit-symbol">%</span>
              </div>
            </div>
          </div>

          {/* Opción 2: Descuento en Crédito USD ($) */}
          <div className="discount-card">
            <div className="discount-card-header">
              <div className="discount-card-title-wrap">
                <DollarSign size={15} className="text-emerald" />
                <span className="discount-card-label">2. Descuento en Crédito USD ($)</span>
              </div>
              <span className="discount-card-sub">
                {discountCreditAmount > 0 ? (
                  <strong className="text-emerald">-{formatUSD(discountCreditAmount)}</strong>
                ) : (
                  <span className="text-muted">$0.00</span>
                )}
              </span>
            </div>
            <p className="discount-card-help">
              Saldo a favor en billetera MyUS, crédito de bienvenida o recompensas por referidos.
            </p>

            {/* Presets Rápidos */}
            <div className="discount-presets-row">
              {creditPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={`discount-preset-btn ${discountCreditRaw === preset.value ? 'active' : ''}`}
                  onClick={() => onUpdateMyUS({ discountCreditUSD: preset.value })}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Input Manual de Crédito USD */}
            <div className="discount-input-row">
              <label className="discount-input-label">Monto de crédito:</label>
              <div className="input-with-currency small-pill-input">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  min="0"
                  step="1.00"
                  value={discountCreditRaw || ''}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    onUpdateMyUS({ discountCreditUSD: val });
                  }}
                  placeholder="0.00"
                  className="table-input price-input text-right"
                />
                <span className="unit-symbol">USD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de Descuento si está activo */}
        {totalDiscountAmount > 0 && (
          <div className="active-discounts-callout">
            <div className="callout-left">
              <Sparkles size={16} className="text-emerald" />
              <span>
                Flete base <strong>{formatUSD(baseShippingCharge)}</strong> con descuentos aplicados:{' '}
                {discountPercent > 0 && <span className="discount-tag-bubble">{discountPercent}% OFF (-{formatUSD(discountPercentAmount)})</span>}
                {discountCreditAmount > 0 && <span className="discount-tag-bubble">Crédito -{formatUSD(discountCreditAmount)}</span>}
              </span>
            </div>
            <div className="callout-right">
              <span className="callout-net-label">Flete Neto Resultante:</span>
              <strong className="callout-net-value text-emerald">{formatUSD(netShippingCharge)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          BLOQUE C: TARJETA SHIP REQUEST SUMMARY (IDÉNTICA A LA FACTURA MYUS)
         ========================================================================= */}
      <div className="ship-request-summary-box">
        <div className="summary-card-top">
          <div className="summary-heading-row">
            <h3 className="summary-box-title">Ship Request Summary</h3>
            <span className="based-weight-badge">
              Basado en {billableWeightLbs} lbs{totalWeightLbs > 0 && totalWeightLbs !== billableWeightLbs ? ` (real: ${totalWeightLbs.toFixed(2)} lbs)` : ''} • {activeMethodMeta.name}
            </span>
          </div>
          <p className="summary-box-desc">
            Cargos consolidados de suite y despacho internacional directo a Bolivia (redondeo al entero superior: {billableWeightLbs} lbs).
          </p>
        </div>

        <div className="myus-charges-list">
          {/* 1. Shipping Charges (Base) */}
          <div className="myus-charge-row">
            <div className="charge-left">
              <div className="charge-title-group">
                <span className="charge-label">Shipping Charges (Flete Base)</span>
                <span className={`charge-hint-pill ${activeMethodMeta.carrierCode}`}>
                  {activeMethodMeta.name}
                </span>
                {activeMethodMeta.isBestValue && (
                  <span className="mini-best-value-tag">Best Value</span>
                )}
              </div>
              <span className="charge-desc">
                {myusConfig.autoCalculateShipping 
                  ? `Tarifa TruePrice™ calculada para ${billableWeightLbs} lbs${totalWeightLbs > 0 && totalWeightLbs !== billableWeightLbs ? ` (redondeado de ${totalWeightLbs.toFixed(2)} lbs)` : ''} (${activeMethodMeta.transitDays} hábiles)` 
                  : 'Tarifa de flete ingresada manualmente'}
              </span>
            </div>

            <div className="charge-right">
              <div className="input-with-currency small-pill-input">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  value={myusConfig.autoCalculateShipping ? baseShippingCharge : (myusConfig.shippingChargeUSD || '')}
                  onChange={(e) => {
                    onUpdateMyUS({ 
                      autoCalculateShipping: false, 
                      shippingChargeUSD: Math.max(0, parseFloat(e.target.value) || 0) 
                    });
                  }}
                  className="table-input price-input text-right"
                />
                <span className="unit-symbol">USD</span>
              </div>
            </div>
          </div>

          {/* 1.1 Descuento Porcentual (si aplica) */}
          {discountPercentAmount > 0 && (
            <div className="myus-charge-row discount-sub-row">
              <div className="charge-left">
                <div className="charge-title-group">
                  <Percent size={14} className="text-emerald" />
                  <span className="charge-label text-emerald">Descuento Promocional / Membresía (-{discountPercent}%)</span>
                </div>
                <span className="charge-desc">
                  Deducción del {discountPercent}% aplicada directamente sobre el flete base de {formatUSD(baseShippingCharge)}
                </span>
              </div>
              <div className="charge-right">
                <span className="charge-amount-display text-emerald">
                  -{formatUSD(discountPercentAmount)}
                </span>
              </div>
            </div>
          )}

          {/* 1.2 Descuento en Crédito USD (si aplica) */}
          {discountCreditAmount > 0 && (
            <div className="myus-charge-row discount-sub-row">
              <div className="charge-left">
                <div className="charge-title-group">
                  <DollarSign size={14} className="text-emerald" />
                  <span className="charge-label text-emerald">Crédito de Envío MyUS en Cuenta</span>
                </div>
                <span className="charge-desc">
                  Saldo a favor / cupón de crédito deducido del envío
                </span>
              </div>
              <div className="charge-right">
                <span className="charge-amount-display text-emerald">
                  -{formatUSD(discountCreditAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Subtotal Flete Neto (si hubo descuentos) */}
          {totalDiscountAmount > 0 && (
            <div className="myus-charge-row net-shipping-highlight-row">
              <div className="charge-left">
                <div className="charge-title-group">
                  <span className="charge-label">↳ Flete Neto MyUS Efectivo</span>
                </div>
                <span className="charge-desc">
                  Monto final de flete facturado tras aplicar descuentos
                </span>
              </div>
              <div className="charge-right">
                <span className="charge-amount-display text-white">
                  <strong>{formatUSD(netShippingCharge)}</strong>
                </span>
              </div>
            </div>
          )}

          {/* 2. Shipping Preferences (Seguro $3.50 por cada $100 FOB) */}
          <div className="myus-charge-row highlight-sub-row">
            <div className="charge-left">
              <div className="charge-title-group">
                <ShieldCheck size={16} className="text-emerald" />
                <span className="charge-label">Shipping Preferences (Seguro de Envío)</span>
              </div>
              <span className="charge-desc">
                $3.50 USD por cada $100 USD de producto (FOB Total: {formatUSD(totalFobUSD)} → {insuranceTiers} tramo{insuranceTiers > 1 ? 's' : ''})
              </span>
            </div>

            <div className="charge-right">
              <div className="input-with-currency small-pill-input">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={myusConfig.useCustomShippingPreferences ? myusConfig.customShippingPreferencesUSD : activePreferencesCharge}
                  onChange={(e) => {
                    onUpdateMyUS({ 
                      useCustomShippingPreferences: true, 
                      customShippingPreferencesUSD: Math.max(0, parseFloat(e.target.value) || 0) 
                    });
                  }}
                  className="table-input price-input text-right"
                />
                <span className="unit-symbol">USD</span>
              </div>
            </div>
          </div>

          {/* 3. Package Level Charges (Esfuerzo extra / Casillero no identificado: $8.99) */}
          <div className="myus-charge-row">
            <div className="charge-left">
              <div className="charge-title-group">
                <label className="checkbox-charge-label">
                  <input
                    type="checkbox"
                    checked={myusConfig.hasPackageLevelCharges}
                    onChange={(e) => onUpdateMyUS({ hasPackageLevelCharges: e.target.checked })}
                  />
                  <span className="charge-label">Package Level Charges</span>
                </label>
                <span className="penalty-tag">
                  <AlertTriangle size={12} />
                  Error de Guía / Casillero
                </span>
              </div>
              <span className="charge-desc">
                Cargo ($8.99) por búsqueda manual cuando el remitente no colocó correctamente tu número de Suite.
              </span>
            </div>

            <div className="charge-right">
              <span className={`charge-amount-display ${!myusConfig.hasPackageLevelCharges ? 'text-muted' : ''}`}>
                {myusConfig.hasPackageLevelCharges ? formatUSD(activePackageLevelCharge) : '$0.00 USD'}
              </span>
            </div>
          </div>

          {/* 4. Lithium-ion Stickers ($8.00) */}
          <div className="myus-charge-row">
            <div className="charge-left">
              <div className="charge-title-group">
                <label className="checkbox-charge-label">
                  <input
                    type="checkbox"
                    checked={myusConfig.hasLithiumSticker}
                    onChange={(e) => onUpdateMyUS({ hasLithiumSticker: e.target.checked })}
                  />
                  <span className="charge-label">Lithium-ion Stickers</span>
                </label>
                <span className="battery-tag">
                  <BatteryCharging size={12} />
                  Batería de Litio
                </span>
              </div>
              <span className="charge-desc">
                Cargo único de $8.00 USD si el paquete contiene uno o más dispositivos con batería de litio.
              </span>
            </div>

            <div className="charge-right">
              <span className={`charge-amount-display ${!myusConfig.hasLithiumSticker ? 'text-muted' : ''}`}>
                {myusConfig.hasLithiumSticker ? formatUSD(activeLithiumCharge) : '$0.00 USD'}
              </span>
            </div>
          </div>

          {/* 5. Consolidación MyUS */}
          <div className="myus-charge-row">
            <div className="charge-left">
              <div className="charge-title-group">
                <Crown size={15} className="text-amber" />
                <span className="charge-label">Consolidación de Paquetes</span>
              </div>
              <div className="membership-mini-toggle">
                <button
                  type="button"
                  className={`mini-pill-btn ${isPremium ? 'active' : ''}`}
                  onClick={() => onUpdateMyUS({ membershipType: 'premium' })}
                >
                  ⭐ Premium (GRATIS)
                </button>
                <button
                  type="button"
                  className={`mini-pill-btn ${!isPremium ? 'active' : ''}`}
                  onClick={() => onUpdateMyUS({ membershipType: 'free' })}
                >
                  Free Member ($3.00)
                </button>
              </div>
            </div>

            <div className="charge-right">
              <span className="charge-amount-display">
                {isPremium ? <strong className="text-emerald">GRATIS</strong> : '$3.00 USD'}
              </span>
            </div>
          </div>
        </div>

        {/* Total Cost Display */}
        <div className="summary-total-footer">
          <div className="total-footer-left">
            <span className="total-title">Total Cost (Factura MyUS)</span>
            <span className="total-sub">
              Flete Neto ({formatUSD(netShippingCharge)}) + Seguro ({formatUSD(activePreferencesCharge)}) + Cargos MyUS ({formatUSD(activePackageLevelCharge + activeLithiumCharge + consolidationFee)})
            </span>
          </div>

          <div className="total-footer-right">
            <span className="grand-usd-val">{formatUSD(totalMyUSUSD)}</span>
            <span className="grand-bob-val">({formatBOB(totalMyUSBOB)})</span>
          </div>
        </div>
      </div>

      <div className="myus-tax-note">
        <Info size={15} className="info-icon" />
        <span>
          <strong>Regla Aduanera:</strong> Este total de MyUS ({formatUSD(totalMyUSUSD)}) con flete neto y cargos de courier se suma directamente al FOB para constituir la <strong>Base Imponible CIF</strong> ({formatUSD(totalFobUSD + totalMyUSUSD)}), sobre la cual se liquida el <strong>14.94% de IVA</strong> en Bolivia.
        </span>
      </div>
    </div>
  );
};
