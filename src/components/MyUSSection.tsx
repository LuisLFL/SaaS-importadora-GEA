import React from 'react';
import { 
  Package, 
  BatteryCharging, 
  AlertTriangle, 
  ShieldCheck, 
  Crown, 
  Info
} from 'lucide-react';
import type { MyUSConfig } from '../types/calculator';
import { extrapolateMyUSRate } from '../utils/calculatorEngine';
import { formatUSD, formatBOB } from '../utils/formatters';

interface MyUSSectionProps {
  myusConfig: MyUSConfig;
  totalWeightLbs: number;
  totalFobUSD: number;
  exchangeRate: number;
  onUpdateMyUS: (updates: Partial<MyUSConfig>) => void;
}

export const MyUSSection: React.FC<MyUSSectionProps> = ({
  myusConfig,
  totalWeightLbs,
  totalFobUSD,
  exchangeRate,
  onUpdateMyUS
}) => {
  // 1. Shipping Charges
  const extrapolatedShipping = extrapolateMyUSRate(totalWeightLbs);
  const activeShippingCharge = myusConfig.autoCalculateShipping 
    ? extrapolatedShipping 
    : (myusConfig.shippingChargeUSD || 0);

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

  // Gran Total MyUS (igual a la captura Ship Request Summary)
  const totalMyUSUSD = activeShippingCharge + 
    activePreferencesCharge + 
    activePackageLevelCharge + 
    activeLithiumCharge + 
    consolidationFee;

  const totalMyUSBOB = totalMyUSUSD * exchangeRate;

  return (
    <div className="section-card myus-card">
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
              Variables exactas facturadas por MyUS (Flete, seguro por valor, stickers de litio y cargos de paquete).
            </p>
          </div>
        </div>
      </div>

      {/* Tarjeta con formato oficial idéntico a MyUS Ship Request Summary */}
      <div className="ship-request-summary-box">
        <div className="summary-card-top">
          <div className="summary-heading-row">
            <h3 className="summary-box-title">Ship Request Summary</h3>
            <span className="based-weight-badge">
              Basado en {totalWeightLbs.toFixed(2)} lbs
            </span>
          </div>
          <p className="summary-box-desc">
            Cargos de suite y despacho internacional directo a Bolivia (DHL Express).
          </p>
        </div>

        <div className="myus-charges-list">
          {/* 1. Shipping Charges */}
          <div className="myus-charge-row">
            <div className="charge-left">
              <div className="charge-title-group">
                <span className="charge-label">Shipping Charges</span>
                <span className="charge-hint-pill">DHL Express Smallbox</span>
              </div>
              <span className="charge-desc">
                {myusConfig.autoCalculateShipping 
                  ? `Extrapolado automáticamente para ${totalWeightLbs.toFixed(2)} lbs` 
                  : 'Tarifa ingresada manualmente'}
              </span>
            </div>

            <div className="charge-right">
              <div className="input-with-currency small-pill-input">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  value={myusConfig.autoCalculateShipping ? extrapolatedShipping : (myusConfig.shippingChargeUSD || '')}
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

        {/* Total Cost Display (igual al pie de la captura: Total Cost 50.79 USD) */}
        <div className="summary-total-footer">
          <div className="total-footer-left">
            <span className="total-title">Total Cost (Factura MyUS)</span>
            <span className="total-sub">
              Suma de Flete ({formatUSD(activeShippingCharge)}) + Seguro ({formatUSD(activePreferencesCharge)}) + Cargos MyUS ({formatUSD(activePackageLevelCharge + activeLithiumCharge + consolidationFee)})
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
          <strong>Regla Aduanera:</strong> Este total de MyUS ({formatUSD(totalMyUSUSD)}) se suma directamente al valor FOB de las compras en eBay para formar la <strong>Base Imponible CIF</strong>, sobre la cual se calcula el <strong>14.94% de IVA</strong> en Bolivia.
        </span>
      </div>
    </div>
  );
};
