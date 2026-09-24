import type { 
  ProductItem, 
  MyUSConfig, 
  BoliviaCustomsConfig, 
  CalculationSummary, 
  ProductCalculated 
} from '../types/calculator';

export const LBS_TO_KG = 0.45359237;

// Categorías aduaneras en Bolivia: Tecnología y electrónica tienen GA 0% según normativa
export const BOLIVIA_TARIFF_CATEGORIES = [
  { label: 'Tecnología y Electrónica (GA 0% - Exento de Arancel)', value: 'electronics_exempt', ga: 0 },
  { label: 'Smartphones, Tablets y Laptops (GA 0%)', value: 'computers_exempt', ga: 0 },
  { label: 'Consolas, Gadgets y Audio (GA 0%)', value: 'gadgets_exempt', ga: 0 },
  { label: 'Libros y Material Educativo (GA 0%)', value: 'books', ga: 0 },
  { label: 'Repuestos Automotrices / Herramientas (GA 10%)', value: 'spare_parts', ga: 10 },
  { label: 'Ropa y Textiles (GA 20% - 40%)', value: 'clothing', ga: 20 },
  { label: 'Calzado y Zapatillas (GA 40%)', value: 'shoes', ga: 40 },
  { label: 'General / Misceláneo (GA 10%)', value: 'general', ga: 10 },
  { label: 'Personalizado', value: 'custom', ga: 0 }
];

export const EXCHANGE_RATE_PRESETS = [
  { label: 'Hoy (12.26 Bs.)', rate: 12.26 },
  { label: 'Referencia (11.50 Bs.)', rate: 11.50 },
  { label: 'Referencia (13.00 Bs.)', rate: 13.00 },
  { label: 'Oficial Histórico BCB (6.96 Bs.)', rate: 6.96 }
];

/**
 * Extrapolación de tarifas de flete internacional MyUS TruePrice™ (DHL Express Smallbox a Bolivia)
 * - 4.55 - 5 lbs = $30.30 USD
 * - 10 lbs       = $63.67 USD
 * - 15 lbs       = $88.69 USD
 */
export function extrapolateMyUSRate(lbs: number): number {
  if (lbs <= 0) return 0;
  if (lbs <= 1) return 14.99;
  
  if (lbs <= 5) {
    // Interpola entre 1 lb ($14.99) y 5 lbs ($30.30)
    return parseFloat((14.99 + (lbs - 1) * ((30.30 - 14.99) / 4)).toFixed(2));
  }
  
  if (lbs <= 10) {
    // Interpola entre 5 lbs ($30.30) y 10 lbs ($63.67)
    return parseFloat((30.30 + (lbs - 5) * ((63.67 - 30.30) / 5)).toFixed(2));
  }
  
  if (lbs <= 15) {
    // Interpola entre 10 lbs ($63.67) y 15 lbs ($88.69)
    return parseFloat((63.67 + (lbs - 10) * ((88.69 - 63.67) / 5)).toFixed(2));
  }
  
  // Arriba de 15 lbs: extrapolación continua basada en ~$5.004 USD / lb adicional
  return parseFloat((88.69 + (lbs - 15) * 5.004).toFixed(2));
}

export function calculateSummary(
  products: ProductItem[],
  myus: MyUSConfig,
  customs: BoliviaCustomsConfig
): CalculationSummary {
  const totalItemsCount = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
  const totalPackagesCount = products.reduce((acc, p) => acc + (p.packageCount || 1), 0);
  const totalFobUSD = products.reduce((acc, p) => acc + (p.quantity * p.unitPriceUSD || 0), 0);
  const totalWeightLbs = products.reduce((acc, p) => acc + (p.quantity * p.unitWeightLbs || 0), 0);
  const totalWeightKg = totalWeightLbs * LBS_TO_KG;

  // 1. Shipping Charges (Flete base MyUS por peso)
  let myusShippingUSD = 0;
  if (myus.autoCalculateShipping) {
    myusShippingUSD = extrapolateMyUSRate(totalWeightLbs);
  } else {
    myusShippingUSD = Math.max(0, myus.shippingChargeUSD || 0);
  }

  // 2. Shipping Preferences (Seguro MyUS: $3.50 por cada $100 USD de producto)
  let myusShippingPreferencesUSD = 0;
  if (myus.useCustomShippingPreferences) {
    myusShippingPreferencesUSD = Math.max(0, myus.customShippingPreferencesUSD || 0);
  } else {
    // Cálculo oficial: $3.50 por cada tramo de $100 FOB
    const tiers = totalFobUSD > 0 ? Math.ceil(totalFobUSD / 100) : 1;
    myusShippingPreferencesUSD = parseFloat((tiers * (myus.insurancePer100RateUSD || 3.50)).toFixed(2));
  }

  // 3. Package Level Charges ($8.99 por suite no identificada / búsqueda extra de paquete)
  const myusPackageLevelUSD = myus.hasPackageLevelCharges ? (myus.packageLevelChargesUSD || 8.99) : 0;

  // 4. Lithium-ion Stickers ($8.00 único si contiene 1 o más objetos con batería de litio)
  const containsLithium = myus.hasLithiumSticker || products.some(p => p.hasLithiumBattery);
  const myusLithiumStickersUSD = containsLithium ? (myus.lithiumStickerUSD || 8.00) : 0;

  // 5. Consolidación ($0 para Premium, $3 para Free members si consolidan)
  const myusConsolidationUSD = myus.membershipType === 'premium' ? 0.00 : (totalPackagesCount > 1 ? 3.00 : 0.00);

  // Total Facturado por MyUS (entra en la base CIF para el IVA de Bolivia)
  const totalMyUSUSD = myusShippingUSD + 
    myusShippingPreferencesUSD + 
    myusPackageLevelUSD + 
    myusLithiumStickersUSD + 
    myusConsolidationUSD;

  // Base Imponible CIF en Bolivia = Compra en eBay (FOB) + Total MyUS
  const cifBaseUSD = totalFobUSD + totalMyUSUSD;

  // Prorrateo individual por producto
  let totalGaUSD = 0;
  let totalIvaUSD = 0;
  const dhlHandlingUSD = Math.max(0, customs.dhlHandlingFeeUSD ?? 40);
  const otherFeesUSD = (customs.otherCustomsFeesBOB || 0) / (customs.exchangeRate || 1);

  const calculatedProducts: ProductCalculated[] = products.map((item) => {
    const itemTotalQty = item.quantity || 1;
    const itemFobSubtotal = itemTotalQty * (item.unitPriceUSD || 0);
    const itemTotalWeightLbs = itemTotalQty * (item.unitWeightLbs || 0);
    const itemTotalWeightKg = itemTotalWeightLbs * LBS_TO_KG;

    const weightRatio = totalWeightLbs > 0 ? (itemTotalWeightLbs / totalWeightLbs) : (products.length > 0 ? 1 / products.length : 0);
    const valueRatio = totalFobUSD > 0 ? (itemFobSubtotal / totalFobUSD) : (products.length > 0 ? 1 / products.length : 0);

    // Prorrateo de MyUS por peso
    const proratedMyUSUSD = totalMyUSUSD * weightRatio;

    // CIF del producto
    const itemCifUSD = itemFobSubtotal + proratedMyUSUSD;

    // GA: 0% para tecnología y electrónica
    const gaRate = (item.gaPercent || 0) / 100;
    const itemGaUSD = itemCifUSD * gaRate;

    // IVA 14.94% sobre (CIF + GA)
    const ivaRate = (customs.ivaRate || 14.94) / 100;
    const itemIvaUSD = (itemCifUSD + itemGaUSD) * ivaRate;

    // Prorrateo tasa DHL ($40) por peso
    const proratedDhlUSD = dhlHandlingUSD * weightRatio;
    const proratedOtherUSD = otherFeesUSD * valueRatio;

    // Costo desembarcado total
    const totalLandedCostUSD = itemFobSubtotal + proratedMyUSUSD + itemGaUSD + itemIvaUSD + proratedDhlUSD + proratedOtherUSD;
    const unitLandedCostUSD = itemTotalQty > 0 ? totalLandedCostUSD / itemTotalQty : 0;

    // Conversión a Bs.
    const rate = customs.exchangeRate || 12.26;
    const totalLandedCostBOB = totalLandedCostUSD * rate;
    const unitLandedCostBOB = unitLandedCostUSD * rate;

    // Margen y precio de venta
    const marginMultiplier = 1 + ((item.targetMarginPercent || 25) / 100);
    const suggestedSalePriceUSD = unitLandedCostUSD * marginMultiplier;
    const suggestedSalePriceBOB = suggestedSalePriceUSD * rate;

    const unitProfitUSD = suggestedSalePriceUSD - unitLandedCostUSD;
    const unitProfitBOB = unitProfitUSD * rate;
    const totalProfitUSD = unitProfitUSD * itemTotalQty;
    const totalProfitBOB = totalProfitUSD * rate;

    totalGaUSD += itemGaUSD;
    totalIvaUSD += itemIvaUSD;

    return {
      item,
      totalWeightLbs: itemTotalWeightLbs,
      totalWeightKg: itemTotalWeightKg,
      totalFobUSD: itemFobSubtotal,
      fobWeightRatio: weightRatio * 100,
      fobValueRatio: valueRatio * 100,
      proratedMyUSUSD,
      cifUSD: itemCifUSD,
      gaUSD: itemGaUSD,
      ivaUSD: itemIvaUSD,
      proratedDhlUSD,
      totalLandedCostUSD,
      unitLandedCostUSD,
      totalLandedCostBOB,
      unitLandedCostBOB,
      suggestedSalePriceUSD,
      suggestedSalePriceBOB,
      unitProfitUSD,
      unitProfitBOB,
      totalProfitUSD,
      totalProfitBOB
    };
  });

  const totalCustomsTaxesUSD = totalGaUSD + totalIvaUSD;
  const totalLandedCostUSD = totalFobUSD + totalMyUSUSD + totalCustomsTaxesUSD + dhlHandlingUSD + otherFeesUSD;
  const rate = customs.exchangeRate || 12.26;
  const totalLandedCostBOB = totalLandedCostUSD * rate;

  const logisticsCostUSD = totalMyUSUSD + dhlHandlingUSD;
  const logisticsPercentOverFob = totalFobUSD > 0 ? (logisticsCostUSD / totalFobUSD) * 100 : 0;
  const taxesPercentOverFob = totalFobUSD > 0 ? (totalCustomsTaxesUSD / totalFobUSD) * 100 : 0;
  const totalCostMultiplier = totalFobUSD > 0 ? (totalLandedCostUSD / totalFobUSD) : 1;
  const costPerLbUSD = totalWeightLbs > 0 ? (totalLandedCostUSD / totalWeightLbs) : 0;
  const costPerKgUSD = totalWeightKg > 0 ? (totalLandedCostUSD / totalWeightKg) : 0;

  const totalProjectedRevenueUSD = calculatedProducts.reduce((acc, p) => acc + (p.suggestedSalePriceUSD * p.item.quantity), 0);
  const totalProjectedRevenueBOB = totalProjectedRevenueUSD * rate;
  const totalProjectedProfitUSD = calculatedProducts.reduce((acc, p) => acc + p.totalProfitUSD, 0);
  const totalProjectedProfitBOB = totalProjectedProfitUSD * rate;
  const overallRoiPercent = totalLandedCostUSD > 0 ? (totalProjectedProfitUSD / totalLandedCostUSD) * 100 : 0;

  return {
    totalItemsCount,
    totalPackagesCount,
    totalFobUSD,
    totalWeightLbs,
    totalWeightKg,
    myusShippingUSD,
    myusShippingPreferencesUSD,
    myusPackageLevelUSD,
    myusLithiumStickersUSD,
    myusConsolidationUSD,
    totalMyUSUSD,
    cifBaseUSD,
    totalGaUSD,
    totalIvaUSD,
    totalCustomsTaxesUSD,
    dhlHandlingUSD,
    otherFeesUSD,
    totalLandedCostUSD,
    totalLandedCostBOB,
    logisticsCostUSD,
    logisticsPercentOverFob,
    taxesPercentOverFob,
    totalCostMultiplier,
    costPerLbUSD,
    costPerKgUSD,
    totalProjectedRevenueUSD,
    totalProjectedRevenueBOB,
    totalProjectedProfitUSD,
    totalProjectedProfitBOB,
    overallRoiPercent,
    products: calculatedProducts
  };
}

// Ejemplo calibrado exactamente con la captura de MyUS del usuario (4.55 lbs -> $30.30 flete)
export const SAMPLE_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    name: 'Dispositivo Electrónico con Batería (eBay)',
    sellerOrStore: 'eBay Top Rated Seller',
    quantity: 1,
    unitPriceUSD: 100.00, // $100 -> Seguro $3.50 exactos
    unitWeightLbs: 4.55, // 4.55 lbs -> Flete $30.30 exactos de la captura
    packageCount: 1,
    category: 'electronics_exempt',
    gaPercent: 0, // 0% GA para tecnología
    targetMarginPercent: 25,
    hasLithiumBattery: true // Activa el sticker de litio de $8.00
  }
];

export const DEFAULT_MYUS_CONFIG: MyUSConfig = {
  membershipType: 'premium',
  autoCalculateShipping: true,
  shippingChargeUSD: 30.30,
  
  insurancePer100RateUSD: 3.50, // $3.50 por cada $100 USD de producto
  useCustomShippingPreferences: false,
  customShippingPreferencesUSD: 3.50,
  
  hasPackageLevelCharges: true, // Castigo por no haber puesto bien el casillero
  packageLevelChargesUSD: 8.99, // $8.99 exactos de la captura
  
  hasLithiumSticker: true, // Sticker de litio
  lithiumStickerUSD: 8.00, // $8.00 exactos de la captura
  
  consolidationFeeUSD: 0.00
};

export const DEFAULT_BOLIVIA_CONFIG: BoliviaCustomsConfig = {
  exchangeRate: 12.26, // Dólar fijado en 12.26 Bs.
  ivaRate: 14.94, // 14.94% fija legal
  dhlHandlingFeeUSD: 40.00, // $40 USD de manejo DHL
  otherCustomsFeesBOB: 0.00
};
