# Cálculo de Costos Reales — Importación eBay → MyUS → DHL (Bolivia)

Costo unitario real (landed cost) de 4 productos, aplicando la lógica del cotizador
(`src/utils/calculatorEngine.ts`) y **calibrado con las facturas reales** de MyUS y DHL.

- Tipo de cambio real de la operación: **12,20 Bs/USD** (1.077,14 / 88,29).
- Distribución: **impuestos por valor (base CIF)** y **cargos DHL por peso físico**.
- GA = 0% (los 4 productos son tecnología/electrónica).

---

## 1. Datos de entrada (reales)

| # | Producto | Precio eBay (FOB, Bs) | Peso (lb) | Cantidad |
|---|----------|----------------------:|----------:|:--------:|
| 1 | Dell 5400 — i7-8665U | 1.035,30 | 4,25 | 1 |
| 2 | Dell 5420 — i5-1135G7 | 1.038,83 | 4,20 | 1 |
| 3 | Quadro K4200 | 316,69 | 1,90 | 1 |
| 4 | Xeon E5-2680 | 220,74 | 0,30 | 1 |
|   | **Total** | **2.611,56** | **10,65** | **4** |

---

## 2. Factura real de MyUS (88,29 USD = 1.077,14 Bs)

| Concepto | USD |
|----------|----:|
| Shipping Charges | 86,22 |
| 15% Off Your Next Shipment | −12,93 |
| Enhanced Liability Protection (seguro) | 7,00 |
| Lithium-ion Stickers | 8,00 |
| **Total Charge** | **88,29 USD** |

> El seguro real fue **7,00 USD** (valor declarado bajo: 70 USD la i5 y 80 USD la i7).
> Flete neto = 86,22 − 12,93 = **73,29 USD** → se reparte por peso; seguro y cargos, por valor.

---

## 3. Liquidación real de DHL (889 Bs)

| Concepto | Bs |
|----------|----:|
| Impuestos (tributos de importación) | 468,00 |
| Levy charges | 360,00 |
| Servicio de liberación de aduana | 61,00 |
| **Total DHL** | **889,00 Bs** |

> Los **468 Bs de impuestos** reflejan el **valor declarado** (menor al precio pagado),
> no el IVA teórico de 14,94% sobre el valor real (que daría ≈551 Bs).
> Los **360 + 61 = 421 Bs** de cargos DHL se prorratean **por peso**.

---

## 4. Metodología (idéntica a la página)

1. **FOB:** precio pagado en eBay por producto.
2. **MyUS:** flete neto por **peso** + seguro/cargos por **valor** → total 1.077,14 Bs.
3. **CIF** = FOB + MyUS → 2.611,56 + 1.077,14 = **3.688,70 Bs**.
4. **Impuestos (468 Bs):** prorrateados por **valor CIF** de cada producto.
5. **Cargos DHL (421 Bs):** prorrateados por **peso** de cada producto.
6. **Costo total** = FOB + MyUS + Impuestos + Cargos DHL.

> Cuadre: 2.611,56 + 1.077,14 + 468,00 + 421,00 = **4.577,70 Bs ✓**

---

## 5. Resumen final — Costo unitario real

| # | Producto | FOB | MyUS | Impuestos | Cargos DHL | **COSTO FINAL** |
|---|----------|----:|-----:|----------:|-----------:|----------------:|
| 1 | Dell 5400 — i7-8665U | 1.035,30 | 439,39 | 187,10 | 168,00 | **1.829,79 Bs** |
| 2 | Dell 5420 — i5-1135G7 | 1.038,83 | 435,47 | 187,05 | 166,03 | **1.827,38 Bs** |
| 3 | Quadro K4200 | 316,69 | 169,87 | 61,73 | 75,11 | **623,40 Bs** |
| 4 | Xeon E5-2680 | 220,74 | 32,41 | 32,12 | 11,86 | **297,12 Bs** |
|   | **TOTAL** | **2.611,56** | **1.077,14** | **468,00** | **421,00** | **4.577,70 Bs** |

---

## 6. Costo unitario final y precio de venta (+25%)

| Producto | Costo landed | +25% margen |
|----------|-------------:|------------:|
| Dell 5400 — i7-8665U | **1.829,79 Bs** | **2.287,24 Bs** |
| Dell 5420 — i5-1135G7 | **1.827,38 Bs** | **2.284,23 Bs** |
| Quadro K4200 | **623,40 Bs** | **779,25 Bs** |
| Xeon E5-2680 | **297,12 Bs** | **371,40 Bs** |

Fórmula de venta de la página: `Precio venta = Costo landed × (1 + margen %)`.

---

## 7. Nota: por qué el Quadro sale más caro que el Xeon

El **peso manda** en el flete MyUS y en los cargos DHL (ambos por peso):

| Concepto | Quadro K4200 | Xeon E5-2680 |
|----------|-------------:|-------------:|
| FOB (eBay) | 316,69 | 220,74 |
| Peso | **1,90 lb** | 0,30 lb |
| MyUS | 169,87 | 32,41 |
| Cargos DHL | 75,11 | 11,86 |
| **COSTO FINAL** | **623,40** | **297,12** |

El Quadro pesa **6,3× más** que el Xeon y absorbe mucho más costo logístico.
**Liviano = barato de traer; pesado = caro**, aunque cueste parecido en eBay.

---

## 8. Cómo funciona en la página (app)

- La app calcula en **modo automático** por defecto: flete por peso (TruePrice por método),
  seguro $3.50/$100, IVA 14.94% sobre CIF y GA según partida.
- **Cargos DHL en Bs:** tasa base de manejo + levy + liberación de aduana se ingresan en
  **bolivianos** y se convierten a USD con el **tipo de cambio** vigente (ej. 421 Bs a 12 Bs/USD
  = ≈35,08 USD). Ya no hay un $40 fijo en dólares.
- Los **valores reales de este documento** se reproducen cuando se conozcan, usando:
  - MyUS: desactivar "auto" e ingresar flete/seguro reales.
  - Aduana: activar **"Usar monto real pagado"** e ingresar impuestos reales (Bs).
  - DHL: ingresar **manejo + levy + liberación** (Bs) al tipo de cambio de la operación.
- No quedan valores fijos bloqueados: cualquier cambio de precio, peso, cantidad o margen
  recalcula todo en vivo.
- Persistencia migrada a **v6** para que apliquen los defaults automáticos.
