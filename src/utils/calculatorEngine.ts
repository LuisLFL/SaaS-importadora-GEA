import type { 
  ProductItem, 
  MyUSConfig, 
  MyUSShippingMethod,
  BoliviaCustomsConfig, 
  CalculationSummary, 
  ProductCalculated,
  CustomProrationOverrides
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

export interface MyUSShippingOptionMeta {
  id: MyUSShippingMethod;
  name: string;
  carrier: string;
  carrierCode: 'dhl' | 'fedex' | 'ups';
  transitDays: string;
  isBestValue?: boolean;
  maxWeightLbs?: number; // 15 for smallbox, 20 for budget_economy
  packageLimit?: number; // 1 for smallbox/budget_economy, 50 for dhl_express/ups
  consolidationAvailable: boolean;
  maxMerchandiseUSD?: number; // 500 for smallbox
  maxDimensionInches?: number; // 30 for smallbox
  badgeText?: string;
  description: string;
  highlights: string[];
}

export const MYUS_SHIPPING_OPTIONS: MyUSShippingOptionMeta[] = [
  {
    id: 'dhl_smallbox',
    name: 'DHL Express Smallbox',
    carrier: 'DHL Express',
    carrierCode: 'dhl',
    transitDays: '2 - 5 days',
    maxWeightLbs: 15,
    packageLimit: 1,
    consolidationAvailable: false,
    maxMerchandiseUSD: 500,
    maxDimensionInches: 30,
    badgeText: 'Caja Pequeña (Hasta 15 lbs)',
    description: 'Tarifa reducida para 1 sola caja de hasta 15 lbs y máx. $500 FOB. No admite consolidación ni múltiples paquetes.',
    highlights: [
      'Sin consolidación (Límite: 1 paquete)',
      'Límite de peso estricto: 15 lbs',
      'Dimensiones: 30 pulgadas o menos (L+A+H)',
      'Valor de mercancía: $500 USD o menos',
      'TruePrice™ Weight-Based Pricing',
      'Rastreo puerta a puerta • Sin recargo de combustible'
    ]
  },
  {
    id: 'dhl_express',
    name: 'DHL Express',
    carrier: 'DHL Express',
    carrierCode: 'dhl',
    transitDays: '2 - 5 days',
    isBestValue: true,
    consolidationAvailable: true,
    packageLimit: 50,
    badgeText: 'BEST VALUE',
    description: 'La opción recomendada (Best Value): hasta 50 paquetes con empaquetado/consolidación gratuita, sin límite de peso ni de valor.',
    highlights: [
      'Límite: hasta 50 paquetes con consolidación gratuita',
      'Sin límite de peso ni valor FOB',
      'TruePrice™ Weight-Based Pricing',
      'Rastreo puerta a puerta de máxima prioridad',
      'Sin recargo por combustible',
      'Transportista premium de alta confiabilidad'
    ]
  },
  {
    id: 'budget_economy',
    name: 'Budget Economy',
    carrier: 'FedEx Economy',
    carrierCode: 'fedex',
    transitDays: '8 - 14 days',
    maxWeightLbs: 20,
    packageLimit: 1,
    consolidationAvailable: false,
    badgeText: 'Económico (8-14 días)',
    description: 'Alternativa económica a través de FedEx Economy para 1 solo paquete de hasta 20 lbs con tiempo de entrega extendido.',
    highlights: [
      'FedEx Economy (8 - 14 días de tránsito)',
      'Límite de peso: 20 lbs',
      'Solo 1 paquete (sin consolidación)',
      'TruePrice™ Weight-Based Pricing',
      'Rastreo puerta a puerta • Sin recargo combustible'
    ]
  },
  {
    id: 'ups_expedited',
    name: 'UPS Expedited',
    carrier: 'UPS',
    carrierCode: 'ups',
    transitDays: '5 - 9 days',
    consolidationAvailable: true,
    packageLimit: 50,
    badgeText: 'UPS Directo',
    description: 'Servicio formal de UPS con empaquetado conjunto de hasta 50 paquetes y entrega garantizada en 5 a 9 días.',
    highlights: [
      'Hasta 50 paquetes con consolidación conjunta',
      'Tiempo de entrega: 5 - 9 días hábiles',
      'TruePrice™ Weight-Based Pricing',
      'Rastreo puerta a puerta'
    ]
  }
];

/**
 * Cálculo y extrapolación de tarifas de flete internacional MyUS TruePrice™ a Bolivia
 * Calibradas exactamente con las capturas de pantalla oficiales de MyUS:
 * - 5 lbs:  DHL Smallbox = $31.14 USD  |  DHL Express = $38.13 USD
 * - 10 lbs: DHL Smallbox = $65.35 USD  |  DHL Express = $74.27 USD
 * - 15 lbs: DHL Smallbox = $91.21 USD  |  Budget Economy = $101.24 USD  |  DHL Express = $107.35 USD  |  UPS Expedited = $119.39 USD
 */
export function calculateCarrierRate(method: MyUSShippingMethod, lbs: number): number {
  if (lbs <= 0) return 0;

  // Redondeo obligatorio al próximo entero superior según norma oficial courier MyUS (ej. 4.75 lbs -> 5 lbs)
  const billableLbs = Math.max(1, Math.ceil(lbs));

  switch (method) {
    case 'dhl_smallbox': {
      // 5 lbs: $31.14 | 10 lbs: $65.35 | 15 lbs: $91.21
      if (billableLbs <= 1) return 15.50;
      if (billableLbs <= 5) {
        return parseFloat((15.50 + (billableLbs - 1) * ((31.14 - 15.50) / 4)).toFixed(2));
      }
      if (billableLbs <= 10) {
        return parseFloat((31.14 + (billableLbs - 5) * ((65.35 - 31.14) / 5)).toFixed(2));
      }
      if (billableLbs <= 15) {
        return parseFloat((65.35 + (billableLbs - 10) * ((91.21 - 65.35) / 5)).toFixed(2));
      }
      // > 15 lbs: Aunque Smallbox no permite >15 lbs, extrapolamos a la tasa marginal
      return parseFloat((91.21 + (billableLbs - 15) * 5.172).toFixed(2));
    }

    case 'dhl_express': {
      // 5 lbs: $38.13 | 10 lbs: $74.27 | 15 lbs: $107.35
      if (billableLbs <= 1) return 19.50;
      if (billableLbs <= 5) {
        return parseFloat((19.50 + (billableLbs - 1) * ((38.13 - 19.50) / 4)).toFixed(2));
      }
      if (billableLbs <= 10) {
        return parseFloat((38.13 + (billableLbs - 5) * ((74.27 - 38.13) / 5)).toFixed(2));
      }
      if (billableLbs <= 15) {
        return parseFloat((74.27 + (billableLbs - 10) * ((107.35 - 74.27) / 5)).toFixed(2));
      }
      // > 15 lbs: extrapolación continua basada en ~$6.616 USD / lb
      return parseFloat((107.35 + (billableLbs - 15) * 6.616).toFixed(2));
    }

    case 'budget_economy': {
      // 15 lbs: $101.24 USD
      if (billableLbs <= 1) return 18.50;
      if (billableLbs <= 5) {
        return parseFloat((18.50 + (billableLbs - 1) * ((36.20 - 18.50) / 4)).toFixed(2));
      }
      if (billableLbs <= 10) {
        return parseFloat((36.20 + (billableLbs - 5) * ((69.80 - 36.20) / 5)).toFixed(2));
      }
      if (billableLbs <= 15) {
        return parseFloat((69.80 + (billableLbs - 10) * ((101.24 - 69.80) / 5)).toFixed(2));
      }
      return parseFloat((101.24 + (billableLbs - 15) * 6.288).toFixed(2));
    }

    case 'ups_expedited': {
      // 15 lbs: $119.39 USD
      if (billableLbs <= 1) return 22.00;
      if (billableLbs <= 5) {
        return parseFloat((22.00 + (billableLbs - 1) * ((44.10 - 22.00) / 4)).toFixed(2));
      }
      if (billableLbs <= 10) {
        return parseFloat((44.10 + (billableLbs - 5) * ((81.75 - 44.10) / 5)).toFixed(2));
      }
      if (billableLbs <= 15) {
        return parseFloat((81.75 + (billableLbs - 10) * ((119.39 - 81.75) / 5)).toFixed(2));
      }
      return parseFloat((119.39 + (billableLbs - 15) * 7.528).toFixed(2));
    }

    default:
      return 0;
  }
}

export function getAllCarrierRates(lbs: number): Record<MyUSShippingMethod, number> {
  const billableLbs = lbs > 0 ? Math.max(1, Math.ceil(lbs)) : 0;
  return {
    dhl_smallbox: calculateCarrierRate('dhl_smallbox', billableLbs),
    dhl_express: calculateCarrierRate('dhl_express', billableLbs),
    budget_economy: calculateCarrierRate('budget_economy', billableLbs),
    ups_expedited: calculateCarrierRate('ups_expedited', billableLbs)
  };
}

/**
 * Función compatible hacia atrás
 */
export function extrapolateMyUSRate(lbs: number, method: MyUSShippingMethod = 'dhl_smallbox'): number {
  return calculateCarrierRate(method, lbs);
}

export function calculateSummary(
  products: ProductItem[],
  myus: MyUSConfig,
  customs: BoliviaCustomsConfig,
  customProration?: CustomProrationOverrides
): CalculationSummary {
  const totalItemsCount = products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
  const totalPackagesCount = products.reduce((acc, p) => acc + (p.packageCount || 1), 0);
  const totalFobUSD = products.reduce((acc, p) => acc + ((Number(p.quantity) || 0) * (Number(p.unitPriceUSD) || 0)), 0);
  const totalWeightLbs = products.reduce((acc, p) => acc + ((Number(p.quantity) || 0) * (Number(p.unitWeightLbs) || 0)), 0);
  // Redondeo al entero superior para facturación MyUS
  const billableWeightLbs = totalWeightLbs > 0 ? Math.max(1, Math.ceil(totalWeightLbs)) : 0;
  const totalWeightKg = totalWeightLbs * LBS_TO_KG;

  const currentMethod: MyUSShippingMethod = myus.shippingMethod || 'dhl_smallbox';
  const methodMeta = MYUS_SHIPPING_OPTIONS.find(o => o.id === currentMethod) || MYUS_SHIPPING_OPTIONS[0];

  // 1. Shipping Charges (Flete base MyUS por peso facturable al entero superior)
  let myusBaseShippingUSD = 0;
  if (myus.autoCalculateShipping) {
    myusBaseShippingUSD = calculateCarrierRate(currentMethod, billableWeightLbs);
  } else {
    myusBaseShippingUSD = Math.max(0, Number(myus.shippingChargeUSD) || 0);
  }

  // 1.1 Descuentos aplicables al Flete MyUS:
  // a) Descuento Porcentual (% sobre flete base)
  const discountPercent = Math.min(100, Math.max(0, Number(myus.discountPercent) || 0));
  const myusDiscountPercentUSD = parseFloat((myusBaseShippingUSD * (discountPercent / 100)).toFixed(2));
  const subtotalAfterPercent = Math.max(0, myusBaseShippingUSD - myusDiscountPercentUSD);

  // b) Descuento en Crédito USD (saldo/crédito en cuenta MyUS)
  const rawCreditUSD = Math.max(0, Number(myus.discountCreditUSD) || 0);
  const myusDiscountCreditUSD = parseFloat(Math.min(subtotalAfterPercent, rawCreditUSD).toFixed(2));

  // c) Sumatoria de descuentos y Flete Neto resultante
  const myusTotalDiscountUSD = parseFloat((myusDiscountPercentUSD + myusDiscountCreditUSD).toFixed(2));
  const myusShippingUSD = parseFloat(Math.max(0, myusBaseShippingUSD - myusTotalDiscountUSD).toFixed(2));

  // 2. Shipping Preferences (Seguro MyUS: $3.50 por cada $100 USD de producto)
  let myusShippingPreferencesUSD = 0;
  if (myus.useCustomShippingPreferences) {
    myusShippingPreferencesUSD = Math.max(0, Number(myus.customShippingPreferencesUSD) || 0);
  } else {
    // Cálculo oficial: $3.50 por cada tramo de $100 FOB
    const tiers = totalFobUSD > 0 ? Math.ceil(totalFobUSD / 100) : 1;
    myusShippingPreferencesUSD = parseFloat((tiers * (Number(myus.insurancePer100RateUSD) || 3.50)).toFixed(2));
  }

  // 3. Package Level Charges ($8.99 por suite no identificada / búsqueda extra de paquete)
  const myusPackageLevelUSD = myus.hasPackageLevelCharges ? (Number(myus.packageLevelChargesUSD) || 8.99) : 0;

  // 4. Lithium-ion Stickers ($8.00 único si contiene 1 o más objetos con batería de litio)
  const containsLithium = myus.hasLithiumSticker || products.some(p => p.hasLithiumBattery);
  const myusLithiumStickersUSD = containsLithium ? (Number(myus.lithiumStickerUSD) || 8.00) : 0;

  // 5. Consolidación ($0 para Premium, $3 para Free members si consolidan)
  const myusConsolidationUSD = myus.membershipType === 'premium' ? 0.00 : (totalPackagesCount > 1 ? (Number(myus.consolidationFeeUSD) || 3.00) : 0.00);

  // Total Facturado por MyUS (entra en la base CIF para el IVA de Bolivia)
  const totalMyUSUSD = myusShippingUSD + 
    myusShippingPreferencesUSD + 
    myusPackageLevelUSD + 
    myusLithiumStickersUSD + 
    myusConsolidationUSD;

  // Base Imponible CIF en Bolivia = Compra en eBay (FOB) + Total MyUS
  const cifBaseUSD = totalFobUSD + totalMyUSUSD;

  const dhlHandlingUSD = Math.max(0, Number(customs.dhlHandlingFeeUSD) || 0);
  const customsRate = Number(customs.exchangeRate) || 12.26;
  const otherFeesUSD = (Number(customs.otherCustomsFeesBOB) || 0) / customsRate;

  // =========================================================================
  // 1. CÁLCULO BASE INDIVIDUAL DE CADA PRODUCTO (PRORRATEO MIXTO ESTÁNDAR)
  // =========================================================================
  interface BaseProductData {
    item: ProductItem;
    itemTotalQty: number;
    itemUnitPrice: number;
    itemUnitWeight: number;
    itemFobSubtotal: number;
    itemTotalWeightLbs: number;
    itemTotalWeightKg: number;
    weightRatio: number;
    valueRatio: number;
    proratedFreightUSD: number;
    proratedInsuranceUSD: number;
    proratedLithiumUSD: number;
    proratedAdminMyUSUSD: number;
    proratedMyUSUSD: number;
    itemCifUSD: number;
    baseGaUSD: number;
    baseIvaUSD: number;
    baseTaxUSD: number;
    baseDhlUSD: number;
    proratedOtherUSD: number;
  }

  const baseItems: BaseProductData[] = products.map((item) => {
    const itemTotalQty = Math.max(1, Number(item.quantity) || 1);
    const itemUnitPrice = Math.max(0, Number(item.unitPriceUSD) || 0);
    const itemUnitWeight = Math.max(0, Number(item.unitWeightLbs) || 0);
    const itemFobSubtotal = itemTotalQty * itemUnitPrice;
    const itemTotalWeightLbs = itemTotalQty * itemUnitWeight;
    const itemTotalWeightKg = itemTotalWeightLbs * LBS_TO_KG;

    const weightRatio = totalWeightLbs > 0 ? (itemTotalWeightLbs / totalWeightLbs) : (products.length > 0 ? 1 / products.length : 0);
    const valueRatio = totalFobUSD > 0 ? (itemFobSubtotal / totalFobUSD) : (products.length > 0 ? 1 / products.length : 0);

    // Flete internacional MyUS: por peso físico (lbs en avión)
    const proratedFreightUSD = myusShippingUSD * weightRatio;

    // Seguro MyUS ($3.50 / $100): por valor comercial FOB
    const proratedInsuranceUSD = myusShippingPreferencesUSD * valueRatio;

    // Baterías de litio ($8.00):
    const batteryItems = products.filter(p => p.hasLithiumBattery);
    let proratedLithiumUSD = 0;
    if (myusLithiumStickersUSD > 0) {
      if (batteryItems.length > 0) {
        if (item.hasLithiumBattery) {
          const totalBatteryFob = batteryItems.reduce((acc, p) => acc + ((Number(p.quantity) || 1) * (Number(p.unitPriceUSD) || 0)), 0);
          const batteryRatio = totalBatteryFob > 0 ? (itemFobSubtotal / totalBatteryFob) : (1 / batteryItems.length);
          proratedLithiumUSD = myusLithiumStickersUSD * batteryRatio;
        } else {
          proratedLithiumUSD = 0;
        }
      } else {
        proratedLithiumUSD = myusLithiumStickersUSD * valueRatio;
      }
    }

    // Cargos de casillero y consolidación: por valor FOB
    const proratedAdminMyUSUSD = (myusPackageLevelUSD + myusConsolidationUSD) * valueRatio;

    // Total MyUS para el producto (Courier MyUS queda vinculado al flete físico)
    const proratedMyUSUSD = proratedFreightUSD + proratedInsuranceUSD + proratedLithiumUSD + proratedAdminMyUSUSD;

    // Base Imponible CIF
    const itemCifUSD = itemFobSubtotal + proratedMyUSUSD;

    // GA (Gravamen Arancelario)
    const gaRate = (Math.max(0, Number(item.gaPercent) || 0)) / 100;
    const baseGaUSD = itemCifUSD * gaRate;

    // IVA (14.94% efectiva sobre CIF + GA)
    const ivaRate = (customs.ivaRate || 14.94) / 100;
    const baseIvaUSD = (itemCifUSD + baseGaUSD) * ivaRate;
    const baseTaxUSD = baseGaUSD + baseIvaUSD;

    // Tasa fija de Despacho y Manejo DHL Bolivia ($40 USD):
    // Prorrateada proporcionalmente por PESO físico (lbs), al tratarse de un costo de manipulación y manejo físico
    const baseDhlUSD = dhlHandlingUSD * weightRatio;
    const proratedOtherUSD = otherFeesUSD * valueRatio;

    return {
      item,
      itemTotalQty,
      itemUnitPrice,
      itemUnitWeight,
      itemFobSubtotal,
      itemTotalWeightLbs,
      itemTotalWeightKg,
      weightRatio,
      valueRatio,
      proratedFreightUSD,
      proratedInsuranceUSD,
      proratedLithiumUSD,
      proratedAdminMyUSUSD,
      proratedMyUSUSD,
      itemCifUSD,
      baseGaUSD,
      baseIvaUSD,
      baseTaxUSD,
      baseDhlUSD,
      proratedOtherUSD
    };
  });

  // =========================================================================
  // 2. REDISTRIBUCIÓN DINÁMICA DE COSTOS (ACTIVABLE SOLO CON 2 O MÁS ARTÍCULOS)
  // =========================================================================
  const canRedistribute = products.length >= 2;
  const manualTaxes = (canRedistribute && customProration?.manualUnitTaxes) ? customProration.manualUnitTaxes : {};
  const manualDhl = (canRedistribute && customProration?.manualUnitDhl) ? customProration.manualUnitDhl : {};

  const validTaxOverrideIds = new Set(
    products.filter(p => manualTaxes[p.id] !== undefined && manualTaxes[p.id] !== null).map(p => p.id)
  );
  const validDhlOverrideIds = new Set(
    products.filter(p => manualDhl[p.id] !== undefined && manualDhl[p.id] !== null).map(p => p.id)
  );

  const hasAnyTaxCustom = validTaxOverrideIds.size > 0;
  const hasAnyDhlCustom = validDhlOverrideIds.size > 0;
  const hasCustomProration = hasAnyTaxCustom || hasAnyDhlCustom;

  // --- 2.1 Redistribución de DHL ($40 fijo) ---
  const finalDhlUSDMap: Record<string, number> = {};
  const isDhlCustomMap: Record<string, boolean> = {};

  if (hasAnyDhlCustom && canRedistribute) {
    let effectiveDhlOverridden = products.filter(p => validDhlOverrideIds.has(p.id));
    let unmodifiedDhl = products.filter(p => !validDhlOverrideIds.has(p.id));

    // Si todos fueron modificados, el último actúa como equilibrador automático para conservar la suma
    if (unmodifiedDhl.length === 0) {
      const balanceProduct = products[products.length - 1];
      unmodifiedDhl = [balanceProduct];
      effectiveDhlOverridden = products.filter(p => p.id !== balanceProduct.id);
    }

    let sumManualDhl = 0;
    effectiveDhlOverridden.forEach(p => {
      const qty = Math.max(1, Number(p.quantity) || 1);
      const unitVal = Math.max(0, Number(manualDhl[p.id]) || 0);
      const lineDhl = unitVal * qty;
      finalDhlUSDMap[p.id] = lineDhl;
      isDhlCustomMap[p.id] = true;
      sumManualDhl += lineDhl;
    });

    // Asegurar que no exceda el fondo total de DHL
    if (sumManualDhl > dhlHandlingUSD && sumManualDhl > 0) {
      const scale = dhlHandlingUSD / sumManualDhl;
      effectiveDhlOverridden.forEach(p => {
        finalDhlUSDMap[p.id] = finalDhlUSDMap[p.id] * scale;
      });
      sumManualDhl = dhlHandlingUSD;
    }

    const remDhlPool = Math.max(0, dhlHandlingUSD - sumManualDhl);
    const unmodifiedBaseSum = unmodifiedDhl.reduce((acc, p) => {
      const base = baseItems.find(b => b.item.id === p.id);
      return acc + (base?.baseDhlUSD || 0);
    }, 0);

    unmodifiedDhl.forEach(p => {
      const base = baseItems.find(b => b.item.id === p.id);
      if (unmodifiedBaseSum > 0) {
        finalDhlUSDMap[p.id] = remDhlPool * ((base?.baseDhlUSD || 0) / unmodifiedBaseSum);
      } else {
        finalDhlUSDMap[p.id] = remDhlPool / unmodifiedDhl.length;
      }
      isDhlCustomMap[p.id] = false;
    });
  } else {
    baseItems.forEach(b => {
      finalDhlUSDMap[b.item.id] = b.baseDhlUSD;
      isDhlCustomMap[b.item.id] = false;
    });
  }

  // --- 2.2 Redistribución de Impuestos Aduaneros (GA + IVA) ---
  const totalCustomsTaxesBaseUSD = baseItems.reduce((acc, b) => acc + b.baseTaxUSD, 0);
  const finalTaxUSDMap: Record<string, number> = {};
  const isTaxCustomMap: Record<string, boolean> = {};

  if (hasAnyTaxCustom && canRedistribute) {
    let effectiveTaxOverridden = products.filter(p => validTaxOverrideIds.has(p.id));
    let unmodifiedTax = products.filter(p => !validTaxOverrideIds.has(p.id));

    if (unmodifiedTax.length === 0) {
      const balanceProduct = products[products.length - 1];
      unmodifiedTax = [balanceProduct];
      effectiveTaxOverridden = products.filter(p => p.id !== balanceProduct.id);
    }

    let sumManualTax = 0;
    effectiveTaxOverridden.forEach(p => {
      const qty = Math.max(1, Number(p.quantity) || 1);
      const unitVal = Math.max(0, Number(manualTaxes[p.id]) || 0);
      const lineTax = unitVal * qty;
      finalTaxUSDMap[p.id] = lineTax;
      isTaxCustomMap[p.id] = true;
      sumManualTax += lineTax;
    });

    if (sumManualTax > totalCustomsTaxesBaseUSD && sumManualTax > 0) {
      const scale = totalCustomsTaxesBaseUSD / sumManualTax;
      effectiveTaxOverridden.forEach(p => {
        finalTaxUSDMap[p.id] = finalTaxUSDMap[p.id] * scale;
      });
      sumManualTax = totalCustomsTaxesBaseUSD;
    }

    const remTaxPool = Math.max(0, totalCustomsTaxesBaseUSD - sumManualTax);
    const unmodifiedBaseTaxSum = unmodifiedTax.reduce((acc, p) => {
      const base = baseItems.find(b => b.item.id === p.id);
      return acc + (base?.baseTaxUSD || 0);
    }, 0);

    unmodifiedTax.forEach(p => {
      const base = baseItems.find(b => b.item.id === p.id);
      if (unmodifiedBaseTaxSum > 0) {
        finalTaxUSDMap[p.id] = remTaxPool * ((base?.baseTaxUSD || 0) / unmodifiedBaseTaxSum);
      } else {
        finalTaxUSDMap[p.id] = remTaxPool / unmodifiedTax.length;
      }
      isTaxCustomMap[p.id] = false;
    });
  } else {
    baseItems.forEach(b => {
      finalTaxUSDMap[b.item.id] = b.baseTaxUSD;
      isTaxCustomMap[b.item.id] = false;
    });
  }

  // =========================================================================
  // 3. GENERACIÓN DE PRODUCTOS CALCULADOS Y PRECIOS FINALES DE VENTA
  // =========================================================================
  let totalGaUSD = 0;
  let totalIvaUSD = 0;

  const calculatedProducts: ProductCalculated[] = baseItems.map((b) => {
    const finalTax = finalTaxUSDMap[b.item.id] ?? b.baseTaxUSD;
    const finalDhl = finalDhlUSDMap[b.item.id] ?? b.baseDhlUSD;

    let itemGaUSD = 0;
    let itemIvaUSD = 0;
    if (b.baseTaxUSD > 0) {
      const gaShare = b.baseGaUSD / b.baseTaxUSD;
      itemGaUSD = finalTax * gaShare;
      itemIvaUSD = finalTax - itemGaUSD;
    } else {
      itemGaUSD = 0;
      itemIvaUSD = finalTax;
    }

    totalGaUSD += itemGaUSD;
    totalIvaUSD += itemIvaUSD;

    const totalLandedCostUSD = b.itemFobSubtotal + b.proratedMyUSUSD + itemGaUSD + itemIvaUSD + finalDhl + b.proratedOtherUSD;
    const unitLandedCostUSD = b.itemTotalQty > 0 ? totalLandedCostUSD / b.itemTotalQty : 0;

    // Conversión a Bs.
    const rate = customs.exchangeRate || 12.26;
    const totalLandedCostBOB = totalLandedCostUSD * rate;
    const unitLandedCostBOB = unitLandedCostUSD * rate;

    // Margen y precio de venta
    const marginMultiplier = 1 + ((Math.max(0, Number(b.item.targetMarginPercent) || 0)) / 100);
    const suggestedSalePriceUSD = unitLandedCostUSD * marginMultiplier;
    const suggestedSalePriceBOB = suggestedSalePriceUSD * rate;

    const unitProfitUSD = suggestedSalePriceUSD - unitLandedCostUSD;
    const unitProfitBOB = unitProfitUSD * rate;
    const totalProfitUSD = unitProfitUSD * b.itemTotalQty;
    const totalProfitBOB = totalProfitUSD * rate;

    return {
      item: b.item,
      totalWeightLbs: b.itemTotalWeightLbs,
      totalWeightKg: b.itemTotalWeightKg,
      totalFobUSD: b.itemFobSubtotal,
      fobWeightRatio: b.weightRatio * 100,
      fobValueRatio: b.valueRatio * 100,
      proratedMyUSUSD: b.proratedMyUSUSD,
      proratedFreightUSD: b.proratedFreightUSD,
      proratedInsuranceUSD: b.proratedInsuranceUSD,
      cifUSD: b.itemCifUSD,
      gaUSD: itemGaUSD,
      ivaUSD: itemIvaUSD,
      proratedDhlUSD: finalDhl,
      totalLandedCostUSD,
      unitLandedCostUSD,
      totalLandedCostBOB,
      unitLandedCostBOB,
      suggestedSalePriceUSD,
      suggestedSalePriceBOB,
      unitProfitUSD,
      unitProfitBOB,
      totalProfitUSD,
      totalProfitBOB,
      isTaxCustom: isTaxCustomMap[b.item.id],
      isDhlCustom: isDhlCustomMap[b.item.id]
    };
  });

  const totalCustomsTaxesUSD = totalGaUSD + totalIvaUSD;
  const totalLandedCostUSD = totalFobUSD + totalMyUSUSD + totalCustomsTaxesUSD + dhlHandlingUSD + otherFeesUSD;
  const rate = Number(customs.exchangeRate) || 12.26;
  const totalLandedCostBOB = totalLandedCostUSD * rate;

  const logisticsCostUSD = totalMyUSUSD + dhlHandlingUSD;
  const logisticsPercentOverFob = totalFobUSD > 0 ? (logisticsCostUSD / totalFobUSD) * 100 : 0;
  const taxesPercentOverFob = totalFobUSD > 0 ? (totalCustomsTaxesUSD / totalFobUSD) * 100 : 0;
  const totalCostMultiplier = totalFobUSD > 0 ? (totalLandedCostUSD / totalFobUSD) : 1;
  const costPerLbUSD = totalWeightLbs > 0 ? (totalLandedCostUSD / totalWeightLbs) : 0;
  const costPerKgUSD = totalWeightKg > 0 ? (totalLandedCostUSD / totalWeightKg) : 0;

  const totalProjectedRevenueUSD = calculatedProducts.reduce((acc, p) => acc + (p.suggestedSalePriceUSD * (Number(p.item.quantity) || 0)), 0);
  const totalProjectedRevenueBOB = totalProjectedRevenueUSD * rate;
  const totalProjectedProfitUSD = calculatedProducts.reduce((acc, p) => acc + p.totalProfitUSD, 0);
  const totalProjectedProfitBOB = totalProjectedProfitUSD * rate;
  const overallRoiPercent = totalLandedCostUSD > 0 ? (totalProjectedProfitUSD / totalLandedCostUSD) * 100 : 0;

  return {
    totalItemsCount,
    totalPackagesCount,
    totalFobUSD,
    totalWeightLbs,
    billableWeightLbs,
    totalWeightKg,
    myusShippingMethod: currentMethod,
    myusShippingMethodName: methodMeta.name,
    myusBaseShippingUSD,
    myusDiscountPercentUSD,
    myusDiscountCreditUSD,
    myusTotalDiscountUSD,
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
    hasCustomProration,
    products: calculatedProducts
  };
}

// Ejemplo calibrado exactamente con la captura oficial de MyUS del usuario (5 lbs -> $31.14 Smallbox / $38.13 DHL Express)
export const SAMPLE_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-1',
    name: 'Dispositivo Electrónico con Batería (eBay)',
    sellerOrStore: 'eBay Top Rated Seller',
    quantity: 1,
    unitPriceUSD: 100.00, // $100 -> Seguro $3.50 exactos
    unitWeightLbs: 5.0, // 5.0 lbs -> DHL Smallbox $31.14 USD / DHL Express $38.13 USD
    packageCount: 1,
    category: 'electronics_exempt',
    gaPercent: 0, // 0% GA para tecnología
    targetMarginPercent: 25,
    hasLithiumBattery: true // Activa el sticker de litio de $8.00
  }
];

export const DEFAULT_MYUS_CONFIG: MyUSConfig = {
  membershipType: 'premium',
  shippingMethod: 'dhl_smallbox',
  autoCalculateShipping: true,
  shippingChargeUSD: 31.14,
  
  discountPercent: 0, // Descuento porcentual (0 - 100%)
  discountCreditUSD: 0, // Descuento en crédito de cuenta en USD ($)
  
  insurancePer100RateUSD: 3.50, // $3.50 por cada $100 USD de producto
  useCustomShippingPreferences: false,
  customShippingPreferencesUSD: 3.50,
  
  hasPackageLevelCharges: true, // Castigo por no haber puesto bien el casillero ($8.99)
  packageLevelChargesUSD: 8.99,
  
  hasLithiumSticker: true, // Sticker de litio ($8.00)
  lithiumStickerUSD: 8.00,
  
  consolidationFeeUSD: 0.00
};

export const DEFAULT_BOLIVIA_CONFIG: BoliviaCustomsConfig = {
  exchangeRate: 12.26, // Dólar fijado en 12.26 Bs.
  ivaRate: 14.94, // 14.94% fija legal
  dhlHandlingFeeUSD: 40.00, // $40 USD de manejo DHL
  otherCustomsFeesBOB: 0.00
};
