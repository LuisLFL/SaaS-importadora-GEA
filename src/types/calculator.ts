export interface ProductItem {
  id: string;
  name: string;
  sellerOrStore: string; // e.g. "eBay"
  quantity: number;
  unitPriceUSD: number; // FOB price per unit
  unitWeightLbs: number; // Weight in pounds per unit
  packageCount: number; // How many boxes/packages
  category: string;
  gaPercent: number; // Gravamen Arancelario % (0% para tecnología y electrónica)
  targetMarginPercent: number; // Margen de utilidad comercial deseado (ej. 25%)
  hasLithiumBattery?: boolean; // Si contiene batería de litio (activa sticker de $8)
  isExcluded?: boolean; // Si está marcado en el box para ocultar/excluir en la simulación What-If
}

export type MyUSShippingMethod = 'dhl_smallbox' | 'dhl_express' | 'budget_economy' | 'ups_expedited';

export interface MyUSCustomFee {
  id: string;
  name: string; // Nombre del cargo adicional (ej. "Reempaque", "Fotos", "Almacenaje")
  amountUSD: number; // Costo en dólares USD
}

export interface MyUSConfig {
  membershipType: 'premium' | 'free'; // Premium ($0 consolidación) vs Free ($3.00)
  shippingMethod: MyUSShippingMethod; // 'dhl_smallbox' | 'dhl_express' | 'budget_economy' | 'ups_expedited'
  autoCalculateShipping: boolean; // Extrapolación de TruePrice™
  shippingChargeUSD: number; // Tarifa de flete base por peso (o manual)
  
  // Descuentos en flete MyUS
  discountPercent: number; // Descuento porcentual (ej. 15% o 20% OFF de membresía/tarjeta/cupón)
  discountCreditUSD: number; // Descuento en crédito fijo USD (ej. $10.00 USD de saldo en cuenta)
  
  // Shipping Preferences: Seguro ($3.50 por cada $100 de producto)
  insurancePer100RateUSD: number; // $3.50
  useCustomShippingPreferences: boolean;
  customShippingPreferencesUSD: number;
  
  // Package Level Charges: Cargo por esfuerzo extra / casillero no identificado ($8.99)
  hasPackageLevelCharges: boolean;
  packageLevelChargesUSD: number; // $8.99
  
  // Lithium-ion Stickers: $8.00 fijo si hay objetos con batería
  hasLithiumSticker: boolean;
  lithiumStickerUSD: number; // $8.00
  
  consolidationFeeUSD: number;

  // Cargos adicionales de MyUS replicables (nombre + costo en USD)
  customFees?: MyUSCustomFee[];
}

export interface BoliviaCustomsConfig {
  exchangeRate: number; // BOB por USD (ej. 12.26)
  ivaRate: number; // 14.94% efectiva
  dhlHandlingFeeUSD: number; // $40.00 USD
  otherCustomsFeesBOB: number;
}

export interface ProductCalculated {
  item: ProductItem;
  totalWeightLbs: number;
  totalWeightKg: number;
  totalFobUSD: number;
  fobWeightRatio: number;
  fobValueRatio: number;
  proratedMyUSUSD: number;
  proratedFreightUSD?: number;
  proratedInsuranceUSD?: number;
  cifUSD: number;
  gaUSD: number;
  ivaUSD: number;
  proratedDhlUSD: number;
  totalLandedCostUSD: number;
  unitLandedCostUSD: number;
  totalLandedCostBOB: number;
  unitLandedCostBOB: number;
  suggestedSalePriceUSD: number;
  suggestedSalePriceBOB: number;
  unitProfitUSD: number;
  unitProfitBOB: number;
  totalProfitUSD: number;
  totalProfitBOB: number;
  isTaxCustom?: boolean;
  isDhlCustom?: boolean;
}

export interface CustomProrationOverrides {
  manualUnitTaxes: Record<string, number>;
  manualUnitDhl: Record<string, number>;
}

export interface CalculationSummary {
  totalItemsCount: number;
  totalPackagesCount: number;
  totalFobUSD: number;
  totalWeightLbs: number;
  billableWeightLbs: number; // Peso facturable redondeado al próximo entero superior
  totalWeightKg: number;
  
  // Desglose idéntico a Ship Request Summary de MyUS
  myusShippingMethod: MyUSShippingMethod;
  myusShippingMethodName: string;
  myusBaseShippingUSD: number; // Flete antes de descuentos
  myusDiscountPercentUSD: number; // Descuento porcentual en USD
  myusDiscountCreditUSD: number; // Descuento en crédito en USD
  myusTotalDiscountUSD: number; // Total descuentos aplicados
  myusShippingUSD: number; // Flete neto tras descuentos
  myusShippingPreferencesUSD: number; // Seguro $3.50 / $100
  myusPackageLevelUSD: number; // $8.99 por suite/esfuerzo extra
  myusLithiumStickersUSD: number; // $8.00 sticker litio
  myusConsolidationUSD: number;
  myusCustomFeesTotalUSD?: number; // Total de cargos adicionales MyUS
  myusCustomFees?: MyUSCustomFee[]; // Lista de cargos adicionales MyUS
  totalMyUSUSD: number;
  
  // Base Aduana Bolivia
  cifBaseUSD: number; // FOB + Total MyUS
  totalGaUSD: number; // 0% para tecnología
  totalIvaUSD: number; // 14.94% sobre (CIF + GA)
  totalCustomsTaxesUSD: number;
  
  // Manejo DHL
  dhlHandlingUSD: number; // $40 USD
  otherFeesUSD: number;
  
  // Totales Finales
  totalLandedCostUSD: number;
  totalLandedCostBOB: number;
  
  // KPIs
  logisticsCostUSD: number;
  logisticsPercentOverFob: number;
  taxesPercentOverFob: number;
  totalCostMultiplier: number;
  costPerLbUSD: number;
  costPerKgUSD: number;
  
  // Ventas y Ganancias
  totalProjectedRevenueUSD: number;
  totalProjectedRevenueBOB: number;
  totalProjectedProfitUSD: number;
  totalProjectedProfitBOB: number;
  overallRoiPercent: number;
  
  hasCustomProration?: boolean;
  products: ProductCalculated[];
}

export interface SavedQuotation {
  id: string;
  title: string;
  date: string;
  products: ProductItem[];
  myusConfig: MyUSConfig;
  customsConfig: BoliviaCustomsConfig;
  customProration?: CustomProrationOverrides;
  totalLandedUSD: number;
  totalLandedBOB: number;
}
