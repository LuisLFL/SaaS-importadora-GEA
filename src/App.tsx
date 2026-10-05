import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ExchangeRateTransformer } from './components/ExchangeRateTransformer';
import { ProductsSection } from './components/ProductsSection';
import { MyUSSection } from './components/MyUSSection';
import { BoliviaCustomsSection } from './components/BoliviaCustomsSection';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { ProductCostBreakdownTable } from './components/ProductCostBreakdownTable';
import { SavedQuotesModal } from './components/SavedQuotesModal';
import { PrintReportView } from './components/PrintReportView';
import { ExecutiveSummaryTable } from './components/ExecutiveSummaryTable';

import type { 
  ProductItem, 
  MyUSConfig, 
  BoliviaCustomsConfig, 
  SavedQuotation 
} from './types/calculator';
import { 
  calculateSummary, 
  SAMPLE_PRODUCTS, 
  DEFAULT_MYUS_CONFIG, 
  DEFAULT_BOLIVIA_CONFIG 
} from './utils/calculatorEngine';

export const App: React.FC = () => {
  // Estado de Productos
  const [products, setProducts] = useState<ProductItem[]>(() => {
    const saved = localStorage.getItem('gea_current_products_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return SAMPLE_PRODUCTS;
  });

  // Estado de MyUS
  const [myusConfig, setMyusConfig] = useState<MyUSConfig>(() => {
    const saved = localStorage.getItem('gea_current_myus_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_MYUS_CONFIG;
  });

  // Estado de Aduana Bolivia y Tasa de Cambio (12.26 Bs por defecto)
  const [customsConfig, setCustomsConfig] = useState<BoliviaCustomsConfig>(() => {
    const saved = localStorage.getItem('gea_current_customs_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_BOLIVIA_CONFIG;
  });

  // Estado de UI
  const [currencyMode, setCurrencyMode] = useState<'both' | 'usd' | 'bob'>('both');
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuotation[]>(() => {
    const saved = localStorage.getItem('gea_saved_quotations_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Auto-guardado de la sesión actual
  useEffect(() => {
    localStorage.setItem('gea_current_products_v3', JSON.stringify(products));
    localStorage.setItem('gea_current_myus_v3', JSON.stringify(myusConfig));
    localStorage.setItem('gea_current_customs_v3', JSON.stringify(customsConfig));
  }, [products, myusConfig, customsConfig]);

  // Persistencia de cotizaciones guardadas
  useEffect(() => {
    localStorage.setItem('gea_saved_quotations_list', JSON.stringify(savedQuotes));
  }, [savedQuotes]);

  // Cálculo reactivo en tiempo real de todo el modelo financiero
  const summary = useMemo(() => {
    return calculateSummary(products, myusConfig, customsConfig);
  }, [products, myusConfig, customsConfig]);

  // Manejo de productos
  const handleAddProduct = () => {
    const newProduct: ProductItem = {
      id: `prod-${Date.now()}`,
      name: '',
      sellerOrStore: 'eBay',
      quantity: 1,
      unitPriceUSD: 100.00,
      unitWeightLbs: 2.0,
      packageCount: 1,
      category: 'electronics_exempt',
      gaPercent: 0, // Tecnología y electrónica 0% GA
      targetMarginPercent: 25,
      hasLithiumBattery: false
    };
    setProducts([...products, newProduct]);
  };

  const handleUpdateProduct = (id: string, updates: Partial<ProductItem>) => {
    setProducts(products.map(p => (p.id === id ? { ...p, ...updates } : p)));
  };

  const handleRemoveProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleDuplicateProduct = (id: string) => {
    const target = products.find(p => p.id === id);
    if (!target) return;
    const duplicated: ProductItem = {
      ...target,
      id: `prod-${Date.now()}`,
      name: `${target.name} (Copia)`
    };
    setProducts([...products, duplicated]);
  };

  // Manejo de MyUS
  const handleUpdateMyUS = (updates: Partial<MyUSConfig>) => {
    setMyusConfig(prev => ({ ...prev, ...updates }));
  };

  // Manejo de Aduana y Tipo de cambio
  const handleExchangeRateChange = (rate: number) => {
    setCustomsConfig(prev => ({ ...prev, exchangeRate: rate }));
  };

  const handleUpdateCustoms = (updates: Partial<BoliviaCustomsConfig>) => {
    setCustomsConfig(prev => ({ ...prev, ...updates }));
  };

  // Acciones globales
  const handleLoadSample = () => {
    setProducts(SAMPLE_PRODUCTS);
    setMyusConfig(DEFAULT_MYUS_CONFIG);
    setCustomsConfig(DEFAULT_BOLIVIA_CONFIG);
  };

  const handleReset = () => {
    if (window.confirm('¿Deseas reiniciar todos los valores del cálculo?')) {
      setProducts([]);
      setMyusConfig({
        ...DEFAULT_MYUS_CONFIG,
        shippingChargeUSD: 0,
        packageLevelChargesUSD: 0,
        consolidationFeeUSD: 0
      });
    }
  };

  const handleSaveQuote = () => {
    const title = window.prompt(
      'Nombre para esta cotización:', 
      `Importación eBay (${products.length} productos) - ${new Date().toLocaleDateString('es-BO')}`
    );
    if (!title) return;

    const newQuote: SavedQuotation = {
      id: `quote-${Date.now()}`,
      title,
      date: new Date().toLocaleDateString('es-BO', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      products: [...products],
      myusConfig: { ...myusConfig },
      customsConfig: { ...customsConfig },
      totalLandedUSD: summary.totalLandedCostUSD,
      totalLandedBOB: summary.totalLandedCostBOB
    };

    setSavedQuotes([newQuote, ...savedQuotes]);
    alert('¡Cotización guardada exitosamente en el historial!');
  };

  const handleDeleteQuote = (id: string) => {
    if (window.confirm('¿Eliminar esta cotización guardada?')) {
      setSavedQuotes(savedQuotes.filter(q => q.id !== id));
    }
  };

  const handleLoadQuote = (quote: SavedQuotation) => {
    setProducts(quote.products);
    setMyusConfig(quote.myusConfig);
    setCustomsConfig(quote.customsConfig);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app-layout">
      {/* Barra de Navegación Principal */}
      <Navbar
        currencyMode={currencyMode}
        onCurrencyModeChange={setCurrencyMode}
        onLoadSample={handleLoadSample}
        onReset={handleReset}
        onSaveQuote={handleSaveQuote}
        onOpenSavedModal={() => setIsSavedModalOpen(true)}
        savedQuotesCount={savedQuotes.length}
        onPrint={handlePrint}
      />

      {/* Vista de pantalla imprimible exclusiva para window.print() */}
      <div className="print-only-wrapper">
        <PrintReportView 
          summary={summary}
          customsConfig={customsConfig}
        />
      </div>

      {/* Contenedor Principal de la Aplicación */}
      <main className="main-content-container screen-only-wrapper">
        {/* Transformador de Dólar (USD ⇄ BOB) */}
        <ExchangeRateTransformer
          exchangeRate={customsConfig.exchangeRate}
          onExchangeRateChange={handleExchangeRateChange}
        />

        {/* 1. Compras en eBay / Valor FOB */}
        <ProductsSection
          products={products}
          exchangeRate={customsConfig.exchangeRate}
          currencyMode={currencyMode}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onRemoveProduct={handleRemoveProduct}
          onDuplicateProduct={handleDuplicateProduct}
        />

        {/* Bloque de Dos Columnas: MyUS y Liquidación Bolivia */}
        <div className="two-column-split">
          {/* 2. MyUS Courier Variables */}
          <MyUSSection
            myusConfig={myusConfig}
            totalWeightLbs={summary.totalWeightLbs}
            totalFobUSD={summary.totalFobUSD}
            exchangeRate={customsConfig.exchangeRate}
            totalPackagesCount={summary.totalPackagesCount}
            onUpdateMyUS={handleUpdateMyUS}
          />

          {/* 3. Aduana Bolivia & DHL */}
          <BoliviaCustomsSection
            customsConfig={customsConfig}
            summary={summary}
            exchangeRate={customsConfig.exchangeRate}
            onUpdateCustoms={handleUpdateCustoms}
          />
        </div>

        {/* 3.5 Resumen Maestro: Los 3 Pilares y Sumatoria Final */}
        <ExecutiveSummaryTable
          products={products}
          summary={summary}
          exchangeRate={customsConfig.exchangeRate}
          currencyMode={currencyMode}
        />

        {/* 4. Métricas Clave y Analytics */}
        <AnalyticsDashboard
          summary={summary}
          exchangeRate={customsConfig.exchangeRate}
        />

        {/* 5. Prorrateo y Precios de Venta Unitarios */}
        <ProductCostBreakdownTable
          products={summary.products}
          exchangeRate={customsConfig.exchangeRate}
          currencyMode={currencyMode}
        />
      </main>

      {/* Modal de Historial de Cotizaciones */}
      <SavedQuotesModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedQuotes={savedQuotes}
        onLoadQuote={handleLoadQuote}
        onDeleteQuote={handleDeleteQuote}
      />
    </div>
  );
};

export default App;
