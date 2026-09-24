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
}

export interface MyUSConfig {
  membershipType: 'premium' | 'free'; // Premium ($0 consolidación) vs Free ($3.00)
  autoCalculateShipping: boolean; // Extrapolación de TruePrice™
  shippingChargeUSD: number; // Tarifa de flete por peso
  
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
}

export interface CalculationSummary {
  totalItemsCount: number;
  totalPackagesCount: number;
  totalFobUSD: number;
  totalWeightLbs: number;
  totalWeightKg: number;
  
  // Desglose idéntico a Ship Request Summary de MyUS
  myusShippingUSD: number;
  myusShippingPreferencesUSD: number; // Seguro $3.50 / $100
  myusPackageLevelUSD: number; // $8.99 por suite/esfuerzo extra
  myusLithiumStickersUSD: number; // $8.00 sticker litio
  myusConsolidationUSD: number;
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
  
  products: ProductCalculated[];
}

export interface SavedQuotation {
  id: string;
  title: string;
  date: string;
  products: ProductItem[];
  myusConfig: MyUSConfig;
  customsConfig: BoliviaCustomsConfig;
  totalLandedUSD: number;
  totalLandedBOB: number;
}
