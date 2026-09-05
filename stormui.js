/**
 * stormui.js  —  Storm Simulator UI
 * Reemplaza DatGui con una interfaz basada en presets para 2D Weather Sandbox.
 * Dos niveles: básico (sliders humanizados) y avanzado (parámetros del motor).
 *
 * Basado en 2D Weather Sandbox por Niels Daemen (GPL-3.0)
 */

'use strict';

// ---------------------------------------------------------------------------
//  1.  DEFINICIÓN DE PRESETS
//      Cada preset define:
//        - meta:       información visual y de dificultad
//        - saveFile:   ruta al .weathersandbox de referencia (null = nueva sim)
//        - resX/resY:  resolución recomendada
//        - guiBase:    overrides base de guiControls para este escenario
//        - basicMap:   sliders simples → transformación a guiControls
//        - advMap:     sliders avanzados → parámetros directos de guiControls
// ---------------------------------------------------------------------------

const STORM_PRESETS = [

  // ── TORMENTA CONVECTIVA ────────────────────────────────────────────────
  {
    id: 'thunderstorm',
    name: 'Tormenta convectiva',
    emoji: '⛈',
    desc: 'Célula convectiva clásica con corrientes ascendentes, cumulonimbus y posibles rayos.',
    category: 'storm',
    difficulty: 'medio',
    saveFile: './saves/Powerful & Longlasting Cell.weathersandbox',
    resX: 200, resY: 300,

    guiBase: {
      condensationRate: 0.0060,
      waterEvaporation: 0.00014,
      landEvaporation:  0.00007,
      evapHeat:         2.90,
      meltingHeat:      0.43,
      waterWeight:      0.25,
      vorticity:        0.005,
      dragMultiplier:   0.001,
      wind:             0.05,
      soundingForcing:  0.10,
      globalDrying:     0.0,
      globalHeating:    0.0,
      spawnChance:      0.00005,
      fallSpeed:        0.0003,
      growthRate0C:     0.0001,
      growthRate_30C:   0.0010,
      snowDensity:      0.20,
      evapRate:         0.0008,
      aboveZeroThreshold: 1.0,
      subZeroThreshold: 0.005,
    },

    basicMap: [
      {
        id: 'intensity', label: 'Intensidad', min: 1, max: 10, defaultVal: 6,
        hint: 'Energía convectiva general de la tormenta.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.condensationRate = lerp(0.003, 0.012, t);
          gc.soundingForcing  = lerp(0.0,   0.40,  t);
          gc.spawnChance      = lerp(0.00002, 0.00009, t);
        },
      },
      {
        id: 'moisture', label: 'Humedad', min: 1, max: 10, defaultVal: 7,
        hint: 'Vapor de agua disponible en la capa baja.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.waterEvaporation = lerp(0.00005, 0.00030, t);
          gc.landEvaporation  = lerp(0.00002, 0.00015, t);
        },
      },
      {
        id: 'wind', label: 'Viento en altura', min: 1, max: 10, defaultVal: 5,
        hint: 'Viento en la troposfera media. Más viento = más cizalladura = tormenta más organizada.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.wind = lerp(-0.05, 0.20, t);
        },
      },
    ],

    advMap: [
      { id: 'condensationRate', label: 'Tasa de condensación', min: 0.001, max: 0.020, step: 0.001,
        hint: 'Velocidad a la que el vapor de agua se convierte en nube. Más = nubes más agresivas.' },
      { id: 'evapHeat',  label: 'Calor de evaporación', min: 1.0, max: 5.0, step: 0.1,
        hint: 'Energía liberada al condensar. Controla cuánto calor impulsa las corrientes ascendentes.' },
      { id: 'wind', label: 'Viento base (m/s internos)', min: -1.0, max: 1.0, step: 0.01,
        hint: 'Valor directo del parámetro de viento horizontal.' },
      { id: 'soundingForcing', label: 'Forzado de sounding', min: 0.0, max: 1.0, step: 0.01,
        hint: 'Cuánto influye el perfil atmosférico cargado en la dinámica de la tormenta.' },
      { id: 'vorticity', label: 'Vorticidad', min: 0.0, max: 0.010, step: 0.001,
        hint: 'Rotación del fluido. Más vorticidad = nubes más turbulentas y realistas.' },
      { id: 'globalDrying', label: 'Secado global', min: 0.0, max: 0.0001, step: 0.000005,
        hint: 'Elimina humedad en toda la atmósfera. 0 = sin secado (máxima actividad).' },
    ],
  },

  // ── GRANIZO INTENSO ────────────────────────────────────────────────────
  {
    id: 'hail',
    name: 'Granizo intenso',
    emoji: '🌨',
    desc: 'Tormenta supercélula con corrientes ascendentes fuertes y granizo de tamaño variable.',
    category: 'storm',
    difficulty: 'avanzado',
    saveFile: './saves/Powerful Hail and Snow Cells.weathersandbox',
    resX: 200, resY: 300,

    guiBase: {
      condensationRate:  0.008,
      waterEvaporation:  0.00016,
      landEvaporation:   0.00008,
      evapHeat:          3.20,
      meltingHeat:       0.60,
      waterWeight:       0.30,
      vorticity:         0.006,
      dragMultiplier:    0.001,
      wind:              0.12,
      soundingForcing:   0.20,
      globalDrying:      0.0,
      globalHeating:     0.0,
      spawnChance:       0.00007,
      fallSpeed:         0.0006,          // caída más rápida = granizo más pesado
      growthRate0C:      0.00015,
      growthRate_30C:    0.0035,          // clave: crecimiento rápido del hielo en altura
      snowDensity:       0.15,            // más denso = más parecido al granizo
      evapRate:          0.0005,
      aboveZeroThreshold: 1.5,
      subZeroThreshold:  0.002,
      freezingRate:      0.015,
      meltingRate:       0.008,           // derrite más lento (granizo tarda en deshacerse)
    },

    basicMap: [
      {
        id: 'intensity', label: 'Intensidad de la tormenta', min: 1, max: 10, defaultVal: 8,
        hint: 'Fuerza general de la corriente ascendente. Más = granizo más grande.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.condensationRate = lerp(0.005, 0.015, t);
          gc.soundingForcing  = lerp(0.05,  0.50,  t);
        },
      },
      {
        id: 'hailsize', label: 'Tamaño del granizo', min: 1, max: 10, defaultVal: 4,
        hint: 'Controla la microfísica del hielo. 1 = granizo pequeño, 10 = granizo del tamaño de una pelota de golf.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.growthRate_30C = lerp(0.001, 0.006, t);
          gc.fallSpeed      = lerp(0.0003, 0.0009, t);
          gc.snowDensity    = lerp(0.25, 0.10, t);   // más denso a medida que crece
          gc.meltingRate    = lerp(0.015, 0.005, t); // el granizo grande tarda más en derretirse
        },
      },
      {
        id: 'wind', label: 'Cizalladura (viento en altura)', min: 1, max: 10, defaultVal: 7,
        hint: 'La cizalladura organiza la tormenta. Más cizalladura = supercélula más potente.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.wind = lerp(0.0, 0.25, t);
        },
      },
    ],

    advMap: [
      { id: 'growthRate_30C', label: 'Crecimiento hielo a -30°C', min: 0.0001, max: 0.006, step: 0.0001,
        hint: 'Velocidad de crecimiento de los cristales de hielo en la cima de la nube. Clave para el tamaño del granizo.' },
      { id: 'fallSpeed', label: 'Velocidad de caída', min: 0.0001, max: 0.001, step: 0.0001,
        hint: 'Cuanto más rápido caiga el granizo, menos tiempo tiene para crecer. Valores altos = granizo más pesado pero pequeño.' },
      { id: 'snowDensity', label: 'Densidad del hielo', min: 0.05, max: 0.50, step: 0.01,
        hint: 'Fracción de densidad (0.1 = hielo muy compacto / granizo, 0.5 = nieve ligera).' },
      { id: 'freezingRate', label: 'Tasa de congelación', min: 0.001, max: 0.05, step: 0.001,
        hint: 'Velocidad a la que la lluvia se congela en las partes frías de la nube.' },
      { id: 'meltingRate', label: 'Tasa de fusión', min: 0.001, max: 0.05, step: 0.001,
        hint: 'Velocidad de fusión del granizo al descender bajo el nivel de 0°C.' },
      { id: 'aboveZeroThreshold', label: 'Umbral lluvia (sobre 0°C)', min: 0.1, max: 2.0, step: 0.1,
        hint: 'Cantidad de agua condensada necesaria para generar precipitación líquida.' },
      { id: 'subZeroThreshold',  label: 'Umbral nieve (bajo 0°C)',  min: 0.001, max: 0.05, step: 0.001,
        hint: 'Cantidad de agua congelada necesaria para generar precipitación sólida.' },
    ],
  },

  // ── NIEBLA DENSA ──────────────────────────────────────────────────────
  {
    id: 'fog',
    name: 'Niebla densa',
    emoji: '🌫',
    desc: 'Niebla de radiación en capa baja. Atmósfera estable, sin precipitación, visibilidad muy reducida.',
    category: 'estable',
    difficulty: 'fácil',
    saveFile: null,
    resX: 150, resY: 300,

    guiBase: {
      condensationRate:  0.0015,
      waterEvaporation:  0.00020,
      landEvaporation:   0.00018,
      evapHeat:          2.90,
      meltingHeat:       0.43,
      waterWeight:       0.05,       // vapor muy ligero, no precipita
      vorticity:         0.002,
      dragMultiplier:    0.005,      // mucho drag = viento muy lento
      wind:              0.002,
      soundingForcing:   0.0,
      globalDrying:      0.0,
      globalHeating:     0.0,
      spawnChance:       0.00001,
      fallSpeed:         0.00005,    // gotas muy pequeñas, casi no caen
      growthRate0C:      0.00005,
      growthRate_30C:    0.00005,
      snowDensity:       0.30,
      evapRate:          0.00020,
      aboveZeroThreshold: 2.0,
      subZeroThreshold:  0.05,
    },

    basicMap: [
      {
        id: 'thickness', label: 'Espesor de la niebla', min: 1, max: 10, defaultVal: 6,
        hint: 'Cuán densa y alta es la niebla. 10 = banco de niebla muy denso.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.condensationRate = lerp(0.0008, 0.003, t);
          gc.waterEvaporation = lerp(0.00010, 0.00025, t);
          gc.landEvaporation  = lerp(0.00010, 0.00022, t);
        },
      },
      {
        id: 'moisture', label: 'Humedad superficial', min: 1, max: 10, defaultVal: 9,
        hint: 'Humedad relativa en la capa baja. Valores altos (8-10) generan niebla más densa.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.landEvaporation  = lerp(0.00005, 0.00025, t);
          gc.waterEvaporation = lerp(0.00008, 0.00028, t);
        },
      },
      {
        id: 'wind', label: 'Viento superficial', min: 1, max: 10, defaultVal: 2,
        hint: 'Viento débil mantiene la niebla; viento fuerte la dispersa. Recomendado: 1-3.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.wind           = lerp(0.0, 0.08, t);
          gc.dragMultiplier = lerp(0.008, 0.001, t);
        },
      },
    ],

    advMap: [
      { id: 'condensationRate', label: 'Tasa de condensación', min: 0.0005, max: 0.005, step: 0.0001,
        hint: 'Velocidad de formación de la niebla. Valores bajos dan niebla tenue.' },
      { id: 'waterWeight', label: 'Peso del agua en nube', min: 0.01, max: 0.5, step: 0.01,
        hint: 'Cuán pesadas son las gotas de niebla. Valores muy bajos = niebla que flota sin precipitar.' },
      { id: 'fallSpeed', label: 'Velocidad de caída', min: 0.00001, max: 0.0003, step: 0.00001,
        hint: 'Velocidad terminal de las microgotas. Muy bajo = niebla estacionaria.' },
      { id: 'globalDrying', label: 'Secado global', min: 0.0, max: 0.00005, step: 0.000001,
        hint: 'Añadir secado dispersa la niebla lentamente (simula el sol de la mañana).' },
    ],
  },

  // ── NEVADA ────────────────────────────────────────────────────────────
  {
    id: 'snowstorm',
    name: 'Nevada intensa',
    emoji: '❄',
    desc: 'Sistema frontal con precipitación de nieve. Temperatura bajo cero en toda la columna.',
    category: 'estable',
    difficulty: 'fácil',
    saveFile: './saves/Mountain Snow Storm.weathersandbox',
    resX: 200, resY: 300,

    guiBase: {
      condensationRate:  0.0055,
      waterEvaporation:  0.00008,
      landEvaporation:   0.00004,
      evapHeat:          2.90,
      meltingHeat:       0.43,
      waterWeight:       0.28,
      vorticity:         0.004,
      dragMultiplier:    0.002,
      wind:              0.06,
      soundingForcing:   0.05,
      globalDrying:      0.0,
      globalHeating:     0.0,
      spawnChance:       0.00004,
      fallSpeed:         0.00020,
      growthRate0C:      0.0003,
      growthRate_30C:    0.0008,
      snowDensity:       0.35,       // nieve ligera
      evapRate:          0.0006,
      aboveZeroThreshold: 1.0,
      subZeroThreshold:  0.003,
      freezingRate:      0.020,
      meltingRate:       0.005,      // funde lento en invierno
      waterTemperature:  2.0,        // agua fría
    },

    basicMap: [
      {
        id: 'intensity', label: 'Intensidad de nevada', min: 1, max: 10, defaultVal: 5,
        hint: 'Cantidad de nieve por hora. 10 = ventisca intensa.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.condensationRate = lerp(0.003, 0.009, t);
          gc.spawnChance      = lerp(0.00002, 0.00008, t);
          gc.growthRate0C     = lerp(0.0001, 0.0005, t);
        },
      },
      {
        id: 'fluffiness', label: 'Tipo de nieve', min: 1, max: 10, defaultVal: 5,
        hint: 'Nieve seca y ligera (1) vs nieve húmeda y pesada (10).',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.snowDensity = lerp(0.12, 0.55, t);   // ligera → pesada
          gc.fallSpeed   = lerp(0.00012, 0.00040, t);
          gc.meltingRate = lerp(0.003, 0.012, t); // nieve húmeda se derrite antes
        },
      },
      {
        id: 'wind', label: 'Viento (ventisca)', min: 1, max: 10, defaultVal: 3,
        hint: 'Viento que arrastra la nieve horizontalmente.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.wind = lerp(0.0, 0.18, t);
        },
      },
    ],

    advMap: [
      { id: 'snowDensity',  label: 'Densidad del copo',  min: 0.05, max: 0.80, step: 0.01,
        hint: 'Fracción de densidad: 0.1 = nieve muy seca y ligera, 0.8 = aguanieve compacta.' },
      { id: 'growthRate0C', label: 'Crecimiento de copo (0°C)', min: 0.00005, max: 0.001, step: 0.00005,
        hint: 'Velocidad de crecimiento de los copos justo en el nivel de congelación.' },
      { id: 'growthRate_30C', label: 'Crecimiento de copo (-30°C)', min: 0.0001, max: 0.003, step: 0.0001,
        hint: 'Crecimiento de cristales de hielo en la cima de la nube.' },
      { id: 'freezingRate', label: 'Tasa de congelación', min: 0.005, max: 0.05, step: 0.001,
        hint: 'Rapidez con la que la lluvia se convierte en nieve al subir de altitud.' },
      { id: 'meltingRate',  label: 'Tasa de fusión',     min: 0.001, max: 0.03, step: 0.001,
        hint: 'Velocidad de deshielo cerca del suelo. 0 = todo llega al suelo como nieve.' },
      { id: 'waterTemperature', label: 'Temperatura del agua (°C)', min: 0.0, max: 15.0, step: 0.5,
        hint: 'Temperatura de la superficie de agua/mar. Afecta a la cantidad de vapor generado.' },
    ],
  },

  // ── LÍNEA DE TURBONADA ────────────────────────────────────────────────
  {
    id: 'squall',
    name: 'Línea de turbonada',
    emoji: '🌪',
    desc: 'Sistema convectivo lineal organizado por alta cizalladura. Vientos fuertes en superficie.',
    category: 'storm',
    difficulty: 'avanzado',
    saveFile: './saves/480 km map with strong derecho.weathersandbox',
    resX: 250, resY: 300,

    guiBase: {
      condensationRate:  0.0070,
      waterEvaporation:  0.00015,
      landEvaporation:   0.00008,
      evapHeat:          3.10,
      meltingHeat:       0.50,
      waterWeight:       0.30,
      vorticity:         0.006,
      dragMultiplier:    0.0008,  // bajo drag = vientos superficiales más fuertes
      wind:              0.18,
      soundingForcing:   0.25,
      globalDrying:      0.0,
      globalHeating:     0.0,
      spawnChance:       0.00006,
      fallSpeed:         0.0004,
      growthRate0C:      0.00012,
      growthRate_30C:    0.0015,
      snowDensity:       0.18,
      evapRate:          0.0010,
      aboveZeroThreshold: 1.2,
      subZeroThreshold:  0.004,
    },

    basicMap: [
      {
        id: 'intensity', label: 'Intensidad', min: 1, max: 10, defaultVal: 7,
        hint: 'Fuerza general del sistema convectivo.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.condensationRate = lerp(0.004, 0.012, t);
          gc.soundingForcing  = lerp(0.10,  0.45,  t);
        },
      },
      {
        id: 'shear', label: 'Cizalladura vertical', min: 1, max: 10, defaultVal: 8,
        hint: 'Diferencia de viento entre el suelo y la troposfera. Más cizalladura = línea más organizada y dañina.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.wind           = lerp(0.05, 0.35, t);
          gc.dragMultiplier = lerp(0.002, 0.0005, t);
        },
      },
      {
        id: 'moisture', label: 'Humedad', min: 1, max: 10, defaultVal: 7,
        hint: 'Vapor de agua en la capa baja. Alimenta el sistema convectivo.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.waterEvaporation = lerp(0.00008, 0.00025, t);
          gc.landEvaporation  = lerp(0.00005, 0.00015, t);
        },
      },
    ],

    advMap: [
      { id: 'wind',             label: 'Viento (parámetro directo)', min: -1.0, max: 1.0, step: 0.01,
        hint: 'Control directo del viento horizontal del motor. Negativo = oeste, positivo = este.' },
      { id: 'dragMultiplier',   label: 'Multiplicador de arrastre', min: 0.0001, max: 0.01, step: 0.0001,
        hint: 'Resistencia del fluido. Bajo = vientos más fuertes y persistentes.' },
      { id: 'condensationRate', label: 'Tasa de condensación', min: 0.002, max: 0.020, step: 0.001,
        hint: 'Agresividad de la formación de nubes.' },
      { id: 'evapRate',         label: 'Tasa de evaporación de lluvia', min: 0.0001, max: 0.003, step: 0.0001,
        hint: 'Cuánta lluvia se evapora antes de llegar al suelo. Crea corrientes frías descendentes.' },
      { id: 'soundingForcing',  label: 'Forzado de sounding', min: 0.0, max: 1.0, step: 0.01,
        hint: 'Influencia del perfil atmosférico cargado.' },
      { id: 'vorticity',        label: 'Vorticidad', min: 0.0, max: 0.010, step: 0.001,
        hint: 'Rotación del fluido. Más = turbulencia más realista en los flancos.' },
    ],
  },

  // ── CÉLULAS MULTICÉLULA ───────────────────────────────────────────────
  {
    id: 'multicell',
    name: 'Tormenta multicélula',
    emoji: '⛅',
    desc: 'Grupo de células convectivas en distintas fases. Típica tarde de verano inestable.',
    category: 'storm',
    difficulty: 'medio',
    saveFile: './saves/Three Nice Cells.weathersandbox',
    resX: 200, resY: 300,

    guiBase: {
      condensationRate:  0.0055,
      waterEvaporation:  0.00012,
      landEvaporation:   0.00006,
      evapHeat:          2.90,
      meltingHeat:       0.43,
      waterWeight:       0.25,
      vorticity:         0.005,
      dragMultiplier:    0.001,
      wind:              0.03,
      soundingForcing:   0.08,
      globalDrying:      0.0,
      globalHeating:     0.0,
      spawnChance:       0.00005,
      fallSpeed:         0.00025,
      growthRate0C:      0.00010,
      growthRate_30C:    0.00090,
      snowDensity:       0.22,
      evapRate:          0.00075,
      aboveZeroThreshold: 1.0,
      subZeroThreshold:  0.005,
    },

    basicMap: [
      {
        id: 'instability', label: 'Inestabilidad', min: 1, max: 10, defaultVal: 6,
        hint: 'Cuán inestable está la atmósfera. Más inestabilidad = células más activas y frecuentes.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.condensationRate = lerp(0.003, 0.010, t);
          gc.soundingForcing  = lerp(0.0,   0.30,  t);
        },
      },
      {
        id: 'moisture', label: 'Humedad', min: 1, max: 10, defaultVal: 6,
        hint: 'Disponibilidad de vapor de agua. Alimenta cada célula individual.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.waterEvaporation = lerp(0.00006, 0.00022, t);
          gc.landEvaporation  = lerp(0.00003, 0.00012, t);
        },
      },
      {
        id: 'organisation', label: 'Organización', min: 1, max: 10, defaultVal: 4,
        hint: 'Cizalladura baja (1) = células desorganizadas y efímeras. Alta (10) = sistema bien organizado.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.wind     = lerp(0.0, 0.12, t);
          gc.vorticity = lerp(0.003, 0.008, t);
        },
      },
    ],

    advMap: [
      { id: 'condensationRate', label: 'Tasa de condensación', min: 0.001, max: 0.015, step: 0.001, hint: '' },
      { id: 'evapRate',         label: 'Evaporación de lluvia', min: 0.0002, max: 0.002, step: 0.0001, hint: 'Evaporación sub-nube que crea downdrafts y refuerza el frente de racha.' },
      { id: 'waterWeight',      label: 'Peso del agua en nube', min: 0.10, max: 0.60, step: 0.01, hint: 'Más peso → el aire húmedo sube menos → células más compactas.' },
      { id: 'vorticity',        label: 'Vorticidad', min: 0.0, max: 0.010, step: 0.001, hint: '' },
    ],
  },

  // ── DÍA DESPEJADO ─────────────────────────────────────────────────────
  {
    id: 'clearday',
    name: 'Día despejado',
    emoji: '☀',
    desc: 'Atmósfera estable con alta presión. Sin precipitación. Perfecto para observar la circulación general.',
    category: 'estable',
    difficulty: 'fácil',
    saveFile: null,
    resX: 150, resY: 300,

    guiBase: {
      condensationRate:  0.002,
      waterEvaporation:  0.00004,
      landEvaporation:   0.00002,
      evapHeat:          2.90,
      meltingHeat:       0.43,
      waterWeight:       0.20,
      vorticity:         0.003,
      dragMultiplier:    0.002,
      wind:              0.02,
      soundingForcing:   0.0,
      globalDrying:      0.000020,
      globalHeating:     0.0,
      spawnChance:       0.000005,
      fallSpeed:         0.0001,
      growthRate0C:      0.00005,
      growthRate_30C:    0.00005,
      snowDensity:       0.30,
      evapRate:          0.0010,
      aboveZeroThreshold: 2.0,
      subZeroThreshold:  0.05,
      sunIntensity:      1.3,
      waterTemperature:  28.0,
    },

    basicMap: [
      {
        id: 'temperature', label: 'Temperatura superficial', min: 1, max: 10, defaultVal: 7,
        hint: 'Cuán cálido es el día. Más calor puede generar pequeñas nubes de buen tiempo.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.waterTemperature = lerp(15.0, 35.0, t);
          gc.globalHeating    = lerp(0.0, 0.00020, t);
        },
      },
      {
        id: 'dryness', label: 'Sequedad del aire', min: 1, max: 10, defaultVal: 7,
        hint: 'Más seco = cielo más azul y limpio. Menos seco = pueden aparecer nubes de buen tiempo.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.globalDrying     = lerp(0.0, 0.00008, t);
          gc.landEvaporation  = lerp(0.00008, 0.000010, t);
          gc.waterEvaporation = lerp(0.00012, 0.000015, t);
        },
      },
      {
        id: 'wind', label: 'Brisa', min: 1, max: 10, defaultVal: 3,
        hint: 'Circulación suave en superficie. No genera tormentas pero da movimiento a la escena.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.wind = lerp(0.0, 0.08, t);
        },
      },
    ],

    advMap: [
      { id: 'globalDrying',   label: 'Secado global', min: 0.0, max: 0.0001, step: 0.000002, hint: 'Elimina humedad activamente. Mantén bajo 0°C el CAPE.' },
      { id: 'waterTemperature', label: 'Temperatura del agua (°C)', min: 10.0, max: 40.0, step: 0.5, hint: 'Temperatura superficial del mar/lago.' },
      { id: 'sunIntensity',   label: 'Intensidad solar', min: 0.5, max: 2.0, step: 0.05, hint: 'Multiplica la radiación solar entrante.' },
      { id: 'condensationRate', label: 'Tasa de condensación', min: 0.0005, max: 0.005, step: 0.0005, hint: 'Mantener bajo para evitar formación de nubes.' },
    ],
  },
];


// ---------------------------------------------------------------------------
//  2.  UTILIDADES
// ---------------------------------------------------------------------------

function lerp(a, b, t) {
  return a + (b - a) * Math.clamp01(t);
}

Math.clamp01 = (v) => Math.max(0, Math.min(1, v));

function applyPresetToGuiControls(preset, sliderValues) {
  // start from the preset's base
  const gc = Object.assign({}, preset.guiBase);

  // apply basic slider transformations
  for (const bm of preset.basicMap) {
    const val = sliderValues[bm.id] !== undefined ? sliderValues[bm.id] : bm.defaultVal;
    bm.apply(val, gc);
  }

  // apply advanced slider values (direct mapping)
  for (const am of preset.advMap) {
    if (sliderValues[am.id] !== undefined) {
      gc[am.id] = sliderValues[am.id];
    }
  }

  return gc;
}

// ---------------------------------------------------------------------------
//  3.  ESTADO GLOBAL DE LA UI
// ---------------------------------------------------------------------------

const UI = {
  selectedPreset: null,
  sliderValues: {},          // { sliderId: value }
  panelVisible: true,
  simRunning: false,
  activeTab: 'presets',      // 'presets' | 'basic' | 'advanced' | 'tools'
};

// ---------------------------------------------------------------------------
//  4.  INYECCIÓN DE ESTILOS
// ---------------------------------------------------------------------------

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* ── Reset parcial ── */
    #sui-root *, #sui-panel * { box-sizing: border-box; }

    /* ── Variables de color ── */
    #sui-root {
      --sui-bg:        rgba(15, 15, 20, 0.92);
      --sui-bg2:       rgba(30, 30, 40, 0.85);
      --sui-bg3:       rgba(45, 45, 60, 0.80);
      --sui-border:    rgba(255,255,255,0.10);
      --sui-border2:   rgba(255,255,255,0.20);
      --sui-text:      #f0f0f0;
      --sui-text2:     #aaa;
      --sui-accent:    #4a90e2;
      --sui-accent2:   #2196F3;
      --sui-success:   #43a047;
      --sui-warning:   #fb8c00;
      --sui-danger:    #e53935;
      --sui-radius:    10px;
      --sui-radius-sm: 6px;
      --sui-fam:       'Segoe UI', system-ui, sans-serif;
      --sui-trans:     0.18s ease;
    }

    /* ── Panel flotante ── */
    #sui-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 340px;
      height: 100vh;
      background: var(--sui-bg);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-left: 1px solid var(--sui-border);
      font-family: var(--sui-fam);
      color: var(--sui-text);
      font-size: 13px;
      display: flex;
      flex-direction: column;
      z-index: 9999;
      transform: translateX(0);
      transition: transform var(--sui-trans);
      overflow: hidden;
    }
    #sui-panel.hidden { transform: translateX(100%); }

    /* ── Header ── */
    .sui-header {
      padding: 14px 16px 10px;
      border-bottom: 1px solid var(--sui-border);
      flex-shrink: 0;
    }
    .sui-header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .sui-title { font-size: 15px; font-weight: 600; color: var(--sui-text); }
    .sui-subtitle { font-size: 11px; color: var(--sui-text2); margin-top: 2px; }
    .sui-close-btn {
      background: none;
      border: 1px solid var(--sui-border2);
      color: var(--sui-text2);
      border-radius: var(--sui-radius-sm);
      cursor: pointer;
      padding: 4px 8px;
      font-size: 12px;
      transition: all var(--sui-trans);
    }
    .sui-close-btn:hover { background: var(--sui-bg3); color: var(--sui-text); }

    /* ── Tabs ── */
    .sui-tabs {
      display: flex;
      gap: 4px;
    }
    .sui-tab {
      flex: 1;
      padding: 6px 4px;
      background: none;
      border: 1px solid transparent;
      border-radius: var(--sui-radius-sm);
      color: var(--sui-text2);
      cursor: pointer;
      font-size: 11px;
      font-family: var(--sui-fam);
      text-align: center;
      transition: all var(--sui-trans);
    }
    .sui-tab:hover { background: var(--sui-bg3); color: var(--sui-text); }
    .sui-tab.active {
      background: var(--sui-bg3);
      border-color: var(--sui-border2);
      color: var(--sui-text);
      font-weight: 600;
    }

    /* ── Scroll area ── */
    .sui-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 12px 14px;
      scrollbar-width: thin;
      scrollbar-color: var(--sui-bg3) transparent;
    }
    .sui-scroll::-webkit-scrollbar { width: 4px; }
    .sui-scroll::-webkit-scrollbar-thumb { background: var(--sui-bg3); border-radius: 2px; }

    /* ── Section label ── */
    .sui-section-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--sui-text2);
      margin: 14px 0 8px;
    }
    .sui-section-label:first-child { margin-top: 0; }

    /* ── Preset cards ── */
    .sui-presets-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .sui-preset-card {
      background: var(--sui-bg2);
      border: 1px solid var(--sui-border);
      border-radius: var(--sui-radius);
      padding: 10px 10px 8px;
      cursor: pointer;
      transition: all var(--sui-trans);
      position: relative;
      min-height: 80px;
    }
    .sui-preset-card:hover {
      border-color: var(--sui-border2);
      background: var(--sui-bg3);
    }
    .sui-preset-card.selected {
      border-color: var(--sui-accent);
      background: var(--sui-bg3);
    }
    .sui-preset-emoji { font-size: 20px; margin-bottom: 5px; line-height: 1; }
    .sui-preset-name { font-size: 12px; font-weight: 600; color: var(--sui-text); margin-bottom: 2px; line-height: 1.2; }
    .sui-preset-desc { font-size: 10px; color: var(--sui-text2); line-height: 1.3; }
    .sui-diff-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 99px;
      font-weight: 600;
    }
    .sui-diff-fácil    { background: rgba(67,160,71,0.25); color: #81c784; }
    .sui-diff-medio    { background: rgba(251,140,0,0.25);  color: #ffb74d; }
    .sui-diff-avanzado { background: rgba(229,57,53,0.25);  color: #ef9a9a; }

    /* ── Category filter ── */
    .sui-filter-row { display: flex; gap: 5px; margin-bottom: 10px; }
    .sui-filter-btn {
      padding: 4px 10px;
      border: 1px solid var(--sui-border);
      border-radius: 99px;
      background: none;
      color: var(--sui-text2);
      cursor: pointer;
      font-size: 11px;
      font-family: var(--sui-fam);
      transition: all var(--sui-trans);
    }
    .sui-filter-btn:hover { border-color: var(--sui-border2); color: var(--sui-text); }
    .sui-filter-btn.active { border-color: var(--sui-accent); color: var(--sui-accent); }

    /* ── Sliders ── */
    .sui-slider-row { margin-bottom: 12px; }
    .sui-slider-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .sui-slider-label { font-size: 12px; color: var(--sui-text); font-weight: 500; }
    .sui-slider-val {
      font-size: 12px;
      font-weight: 600;
      color: var(--sui-accent);
      min-width: 50px;
      text-align: right;
    }
    .sui-slider-hint { font-size: 10px; color: var(--sui-text2); margin-top: 3px; line-height: 1.4; }
    input[type=range].sui-slider {
      width: 100%;
      height: 4px;
      -webkit-appearance: none;
      appearance: none;
      background: var(--sui-bg3);
      border-radius: 2px;
      outline: none;
      cursor: pointer;
    }
    input[type=range].sui-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--sui-accent);
      cursor: pointer;
      transition: transform 0.1s ease;
    }
    input[type=range].sui-slider::-webkit-slider-thumb:hover {
      transform: scale(1.2);
    }

    /* ── Footer / Controls ── */
    .sui-footer {
      padding: 12px 14px;
      border-top: 1px solid var(--sui-border);
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-shrink: 0;
      background: rgba(10, 10, 15, 0.4);
    }
    .sui-btn {
      width: 100%;
      padding: 9px;
      border: 1px solid var(--sui-border2);
      border-radius: var(--sui-radius-sm);
      background: var(--sui-bg2);
      color: var(--sui-text);
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all var(--sui-trans);
    }
    .sui-btn:hover { background: var(--sui-bg3); border-color: var(--sui-accent); }
    .sui-btn-primary {
      background: var(--sui-accent2);
      border-color: transparent;
      color: #fff;
    }
    .sui-btn-primary:hover { background: #1976D2; }

    /* ── Toggle Button ── */
    #sui-toggle-btn {
      position: fixed;
      top: 14px;
      right: 14px;
      z-index: 9998;
      background: var(--sui-bg);
      border: 1px solid var(--sui-border2);
      color: var(--sui-text);
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all var(--sui-trans);
    }
    #sui-toggle-btn:hover { background: var(--sui-bg3); border-color: var(--sui-accent); }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
//  5.  CONSTRUCCIÓN Y RENDERIZADO DE LA UI
// ---------------------------------------------------------------------------

let activeCategory = 'all';

function renderPresetsTab(container) {
  container.innerHTML = '';

  // Filtros
  const filterRow = document.createElement('div');
  filterRow.className = 'sui-filter-row';
  
  const cats = [
    { id: 'all', label: 'Todos' },
    { id: 'storm', label: 'Tormentas' },
    { id: 'estable', label: 'Estables' }
  ];

  cats.forEach(c => {
    const btn = document.createElement('button');
    btn.className = `sui-filter-btn ${activeCategory === c.id ? 'active' : ''}`;
    btn.textContent = c.label;
    btn.onclick = () => {
      activeCategory = c.id;
      renderPresetsTab(container);
    };
    filterRow.appendChild(btn);
  });
  container.appendChild(filterRow);

  // Grid
  const grid = document.createElement('div');
  grid.className = 'sui-presets-grid';

  const filtered = STORM_PRESETS.filter(p => activeCategory === 'all' || p.category === activeCategory);

  filtered.forEach(preset => {
    const isSelected = UI.selectedPreset && UI.selectedPreset.id === preset.id;
    const card = document.createElement('div');
    card.className = `sui-preset-card ${isSelected ? 'selected' : ''}`;
    
    card.innerHTML = `
      <span class="sui-diff-badge sui-diff-${preset.difficulty}">${preset.difficulty}</span>
      <div class="sui-preset-emoji">${preset.emoji}</div>
      <div class="sui-preset-name">${preset.name}</div>
      <div class="sui-preset-desc">${preset.desc}</div>
    `;

    card.onclick = () => selectPreset(preset);
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function renderBasicTab(container) {
  container.innerHTML = '';
  if (!UI.selectedPreset) {
    container.innerHTML = '<div style="color:var(--sui-text2); text-align:center; padding:20px;">Selecciona un preset primero.</div>';
    return;
  }

  const p = UI.selectedPreset;
  const label = document.createElement('div');
  label.className = 'sui-section-label';
  label.textContent = `Controles Básicos: ${p.name}`;
  container.appendChild(label);

  p.basicMap.forEach(bm => {
    const val = UI.sliderValues[bm.id] !== undefined ? UI.sliderValues[bm.id] : bm.defaultVal;
    
    const row = document.createElement('div');
    row.className = 'sui-slider-row';
    row.innerHTML = `
      <div class="sui-slider-header">
        <span class="sui-slider-label">${bm.label}</span>
        <span class="sui-slider-val" id="val-${bm.id}">${val}</span>
      </div>
      <input type="range" class="sui-slider" min="${bm.min}" max="${bm.max}" value="${val}" id="input-${bm.id}">
      <div class="sui-slider-hint">${bm.hint}</div>
    `;

    container.appendChild(row);

    const input = row.querySelector(`#input-${bm.id}`);
    const display = row.querySelector(`#val-${bm.id}`);

    input.oninput = (e) => {
      const v = parseFloat(e.target.value);
      UI.sliderValues[bm.id] = v;
      display.textContent = v;
      applyCurrentSettings();
    };
  });
}

function renderAdvancedTab(container) {
  container.innerHTML = '';
  if (!UI.selectedPreset) {
    container.innerHTML = '<div style="color:var(--sui-text2); text-align:center; padding:20px;">Selecciona un preset primero.</div>';
    return;
  }

  const p = UI.selectedPreset;
  const label = document.createElement('div');
  label.className = 'sui-section-label';
  label.textContent = `Física Avanzada del Motor`;
  container.appendChild(label);

  p.advMap.forEach(am => {
    const defaultVal = p.guiBase[am.id] !== undefined ? p.guiBase[am.id] : am.min;
    const val = UI.sliderValues[am.id] !== undefined ? UI.sliderValues[am.id] : defaultVal;

    const row = document.createElement('div');
    row.className = 'sui-slider-row';
    row.innerHTML = `
      <div class="sui-slider-header">
        <span class="sui-slider-label">${am.label}</span>
        <span class="sui-slider-val" id="val-${am.id}">${val}</span>
      </div>
      <input type="range" class="sui-slider" min="${am.min}" max="${am.max}" step="${am.step || 0.001}" value="${val}" id="input-${am.id}">
      ${am.hint ? `<div class="sui-slider-hint">${am.hint}</div>` : ''}
    `;

    container.appendChild(row);

    const input = row.querySelector(`#input-${am.id}`);
    const display = row.querySelector(`#val-${am.id}`);

    input.oninput = (e) => {
      const v = parseFloat(e.target.value);
      UI.sliderValues[am.id] = v;
      display.textContent = v;
      applyCurrentSettings();
    };
  });
}

function renderToolsTab(container) {
  container.innerHTML = `
    <div class="sui-section-label">Herramientas del Simulador</div>
    <div style="display:flex; flex-direction:column; gap:8px;">
      <button class="sui-btn" id="btn-reset-sim">🔄 Reiniciar Simulación</button>
      <button class="sui-btn" id="btn-clear-clouds">☁️ Limpiar Nubes</button>
    </div>
  `;

  container.querySelector('#btn-reset-sim').onclick = () => {
    if (typeof resetSimulation === 'function') resetSimulation();
  };
  container.querySelector('#btn-clear-clouds').onclick = () => {
    if (typeof guiControls !== 'undefined') {
      guiControls.globalDrying = 0.01;
      setTimeout(() => { guiControls.globalDrying = 0.0; }, 1000);
    }
  };
}

// ---------------------------------------------------------------------------
//  6.  LÓGICA Y CONEXIÓN CON EL MOTOR
// ---------------------------------------------------------------------------

function selectPreset(preset) {
  UI.selectedPreset = preset;
  UI.sliderValues = {}; // Limpia valores al cambiar preset

  // Actualiza los sliders básicos por defecto
  preset.basicMap.forEach(bm => {
    UI.sliderValues[bm.id] = bm.defaultVal;
  });

  // Re-renderiza la tab actual
  switchTab(UI.activeTab);

  // Carga archivo si existe
  if (preset.saveFile && typeof loadSaveFile === 'function') {
    loadSaveFile(preset.saveFile);
  }

  applyCurrentSettings();
}

function applyCurrentSettings() {
  if (!UI.selectedPreset || typeof guiControls === 'undefined') return;

  const newControls = applyPresetToGuiControls(UI.selectedPreset, UI.sliderValues);
  Object.assign(guiControls, newControls);
}

function switchTab(tabId) {
  UI.activeTab = tabId;
  
  document.querySelectorAll('.sui-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabId);
  });

  const scrollArea = document.querySelector('.sui-scroll');
  if (!scrollArea) return;

  if (tabId === 'presets') renderPresetsTab(scrollArea);
  else if (tabId === 'basic') renderBasicTab(scrollArea);
  else if (tabId === 'advanced') renderAdvancedTab(scrollArea);
  else if (tabId === 'tools') renderToolsTab(scrollArea);
}

// ---------------------------------------------------------------------------
//  7.  INICIALIZACIÓN
// ---------------------------------------------------------------------------

function suiInit() {
  injectStyles();

  // Root Container
  const root = document.createElement('div');
  root.id = 'sui-root';

  // Toggle Button
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'sui-toggle-btn';
  toggleBtn.innerHTML = '⚡ Storm UI';
  toggleBtn.onclick = () => {
    const panel = document.getElementById('sui-panel');
    panel.classList.toggle('hidden');
  };
  root.appendChild(toggleBtn);

  // Panel
  const panel = document.createElement('div');
  panel.id = 'sui-panel';

  panel.innerHTML = `
    <div class="sui-header">
      <div class="sui-header-top">
        <div>
          <div class="sui-title">Storm UI</div>
          <div class="sui-subtitle">2D Weather Sandbox</div>
        </div>
        <button class="sui-close-btn" id="sui-close">✕</button>
      </div>
      <div class="sui-tabs">
        <button class="sui-tab active" data-tab="presets">Presets</button>
        <button class="sui-tab" data-tab="basic">Básico</button>
        <button class="sui-tab" data-tab="advanced">Avanzado</button>
        <button class="sui-tab" data-tab="tools">Extras</button>
      </div>
    </div>
    <div class="sui-scroll"></div>
    <div class="sui-footer">
      <button class="sui-btn sui-btn-primary" id="sui-btn-toggle-sim">▶️ Iniciar / Pausa</button>
    </div>
  `;

  root.appendChild(panel);
  document.body.appendChild(root);

  // Event Listeners Panel
  panel.querySelector('#sui-close').onclick = () => panel.classList.add('hidden');

  panel.querySelectorAll('.sui-tab').forEach(tab => {
    tab.onclick = () => switchTab(tab.dataset.tab);
  });

  const playBtn = panel.querySelector('#sui-btn-toggle-sim');
  playBtn.onclick = () => {
    UI.simRunning = !UI.simRunning;
    playBtn.innerHTML = UI.simRunning ? '⏸️ Pausar' : '▶️ Iniciar';
    if (typeof togglePause === 'function') {
      togglePause();
    }
  };

  // Seleccionar el primer preset por defecto
  selectPreset(STORM_PRESETS[0]);
}

// Auto-inicialización al cargar el DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', suiInit);
} else {
  suiInit();
}      waterEvaporation: 0.00014,
      landEvaporation:  0.00007,
      evapHeat:         2.90,
      meltingHeat:      0.43,
      waterWeight:      0.25,
      vorticity:        0.005,
      dragMultiplier:   0.001,
      wind:             0.05,
      soundingForcing:  0.10,
      globalDrying:     0.0,
      globalHeating:    0.0,
      spawnChance:      0.00005,
      fallSpeed:        0.0003,
      growthRate0C:     0.0001,
      growthRate_30C:   0.0010,
      snowDensity:      0.20,
      evapRate:         0.0008,
      aboveZeroThreshold: 1.0,
      subZeroThreshold: 0.005,
    },

    basicMap: [
      {
        id: 'intensity', label: 'Intensidad', min: 1, max: 10, defaultVal: 6,
        hint: 'Energía convectiva general de la tormenta.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.condensationRate = lerp(0.003, 0.012, t);
          gc.soundingForcing  = lerp(0.0,   0.40,  t);
          gc.spawnChance      = lerp(0.00002, 0.00009, t);
        },
      },
      {
        id: 'moisture', label: 'Humedad', min: 1, max: 10, defaultVal: 7,
        hint: 'Vapor de agua disponible en la capa baja.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.waterEvaporation = lerp(0.00005, 0.00030, t);
          gc.landEvaporation  = lerp(0.00002, 0.00015, t);
        },
      },
      {
        id: 'wind', label: 'Viento en altura', min: 1, max: 10, defaultVal: 5,
        hint: 'Viento en la troposfera media. Más viento = más cizalladura = tormenta más organizada.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.wind = lerp(-0.05, 0.20, t);
        },
      },
    ],

    advMap: [
      { id: 'condensationRate', label: 'Tasa de condensación', min: 0.001, max: 0.020, step: 0.001,
        hint: 'Velocidad a la que el vapor de agua se convierte en nube. Más = nubes más agresivas.' },
      { id: 'evapHeat',  label: 'Calor de evaporación', min: 1.0, max: 5.0, step: 0.1,
        hint: 'Energía liberada al condensar. Controla cuánto calor impulsa las corrientes ascendentes.' },
      { id: 'wind', label: 'Viento base (m/s internos)', min: -1.0, max: 1.0, step: 0.01,
        hint: 'Valor directo del parámetro de viento horizontal.' },
      { id: 'soundingForcing', label: 'Forzado de sounding', min: 0.0, max: 1.0, step: 0.01,
        hint: 'Cuánto influye el perfil atmosférico cargado en la dinámica de la tormenta.' },
      { id: 'vorticity', label: 'Vorticidad', min: 0.0, max: 0.010, step: 0.001,
        hint: 'Rotación del fluido. Más vorticidad = nubes más turbulentas y realistas.' },
      { id: 'globalDrying', label: 'Secado global', min: 0.0, max: 0.0001, step: 0.000005,
        hint: 'Elimina humedad en toda la atmósfera. 0 = sin secado (máxima actividad).' },
    ],
  },

  // ── GRANIZO INTENSO ────────────────────────────────────────────────────
  {
    id: 'hail',
    name: 'Granizo intenso',
    emoji: '🌨',
    desc: 'Tormenta supercélula con corrientes ascendentes fuertes y granizo de tamaño variable.',
    category: 'storm',
    difficulty: 'avanzado',
    saveFile: './saves/Powerful Hail and Snow Cells.weathersandbox',
    resX: 200, resY: 300,

    guiBase: {
      condensationRate:  0.008,
      waterEvaporation:  0.00016,
      landEvaporation:   0.00008,
      evapHeat:          3.20,
      meltingHeat:       0.60,
      waterWeight:       0.30,
      vorticity:         0.006,
      dragMultiplier:    0.001,
      wind:              0.12,
      soundingForcing:   0.20,
      globalDrying:      0.0,
      globalHeating:     0.0,
      spawnChance:       0.00007,
      fallSpeed:         0.0006,          // caída más rápida = granizo más pesado
      growthRate0C:      0.00015,
      growthRate_30C:    0.0035,          // clave: crecimiento rápido del hielo en altura
      snowDensity:       0.15,            // más denso = más parecido al granizo
      evapRate:          0.0005,
      aboveZeroThreshold: 1.5,
      subZeroThreshold:  0.002,
      freezingRate:      0.015,
      meltingRate:       0.008,           // derrite más lento (granizo tarda en deshacerse)
    },

    basicMap: [
      {
        id: 'intensity', label: 'Intensidad de la tormenta', min: 1, max: 10, defaultVal: 8,
        hint: 'Fuerza general de la corriente ascendente. Más = granizo más grande.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.condensationRate = lerp(0.005, 0.015, t);
          gc.soundingForcing  = lerp(0.05,  0.50,  t);
        },
      },
      {
        id: 'hailsize', label: 'Tamaño del granizo', min: 1, max: 10, defaultVal: 4,
        hint: 'Controla la microfísica del hielo. 1 = granizo pequeño, 10 = granizo del tamaño de una pelota de golf.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.growthRate_30C = lerp(0.001, 0.006, t);
          gc.fallSpeed      = lerp(0.0003, 0.0009, t);
          gc.snowDensity    = lerp(0.25, 0.10, t);   // más denso a medida que crece
          gc.meltingRate    = lerp(0.015, 0.005, t); // el granizo grande tarda más en derretirse
        },
      },
      {
        id: 'wind', label: 'Cizalladura (viento en altura)', min: 1, max: 10, defaultVal: 7,
        hint: 'La cizalladura organiza la tormenta. Más cizalladura = supercélula más potente.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.wind = lerp(0.0, 0.25, t);
        },
      },
    ],

    advMap: [
      { id: 'growthRate_30C', label: 'Crecimiento hielo a -30°C', min: 0.0001, max: 0.006, step: 0.0001,
        hint: 'Velocidad de crecimiento de los cristales de hielo en la cima de la nube. Clave para el tamaño del granizo.' },
      { id: 'fallSpeed', label: 'Velocidad de caída', min: 0.0001, max: 0.001, step: 0.0001,
        hint: 'Cuanto más rápido caiga el granizo, menos tiempo tiene para crecer. Valores altos = granizo más pesado pero pequeño.' },
      { id: 'snowDensity', label: 'Densidad del hielo', min: 0.05, max: 0.50, step: 0.01,
        hint: 'Fracción de densidad (0.1 = hielo muy compacto / granizo, 0.5 = nieve ligera).' },
      { id: 'freezingRate', label: 'Tasa de congelación', min: 0.001, max: 0.05, step: 0.001,
        hint: 'Velocidad a la que la lluvia se congela en las partes frías de la nube.' },
      { id: 'meltingRate', label: 'Tasa de fusión', min: 0.001, max: 0.05, step: 0.001,
        hint: 'Velocidad de fusión del granizo al descender bajo el nivel de 0°C.' },
      { id: 'aboveZeroThreshold', label: 'Umbral lluvia (sobre 0°C)', min: 0.1, max: 2.0, step: 0.1,
        hint: 'Cantidad de agua condensada necesaria para generar precipitación líquida.' },
      { id: 'subZeroThreshold',  label: 'Umbral nieve (bajo 0°C)',  min: 0.001, max: 0.05, step: 0.001,
        hint: 'Cantidad de agua congelada necesaria para generar precipitación sólida.' },
    ],
  },

  // ── NIEBLA DENSA ──────────────────────────────────────────────────────
  {
    id: 'fog',
    name: 'Niebla densa',
    emoji: '🌫',
    desc: 'Niebla de radiación en capa baja. Atmósfera estable, sin precipitación, visibilidad muy reducida.',
    category: 'estable',
    difficulty: 'fácil',
    saveFile: null,
    resX: 150, resY: 300,

    guiBase: {
      condensationRate:  0.0015,
      waterEvaporation:  0.00020,
      landEvaporation:   0.00018,
      evapHeat:          2.90,
      meltingHeat:       0.43,
      waterWeight:       0.05,       // vapor muy ligero, no precipita
      vorticity:         0.002,
      dragMultiplier:    0.005,      // mucho drag = viento muy lento
      wind:              0.002,
      soundingForcing:   0.0,
      globalDrying:      0.0,
      globalHeating:     0.0,
      spawnChance:       0.00001,
      fallSpeed:         0.00005,    // gotas muy pequeñas, casi no caen
      growthRate0C:      0.00005,
      growthRate_30C:    0.00005,
      snowDensity:       0.30,
      evapRate:          0.00020,
      aboveZeroThreshold: 2.0,
      subZeroThreshold:  0.05,
    },

    basicMap: [
      {
        id: 'thickness', label: 'Espesor de la niebla', min: 1, max: 10, defaultVal: 6,
        hint: 'Cuán densa y alta es la niebla. 10 = banco de niebla muy denso.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.condensationRate = lerp(0.0008, 0.003, t);
          gc.waterEvaporation = lerp(0.00010, 0.00025, t);
          gc.landEvaporation  = lerp(0.00010, 0.00022, t);
        },
      },
      {
        id: 'moisture', label: 'Humedad superficial', min: 1, max: 10, defaultVal: 9,
        hint: 'Humedad relativa en la capa baja. Valores altos (8-10) generan niebla más densa.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.landEvaporation  = lerp(0.00005, 0.00025, t);
          gc.waterEvaporation = lerp(0.00008, 0.00028, t);
        },
      },
      {
        id: 'wind', label: 'Viento superficial', min: 1, max: 10, defaultVal: 2,
        hint: 'Viento débil mantiene la niebla; viento fuerte la dispersa. Recomendado: 1-3.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.wind           = lerp(0.0, 0.08, t);
          gc.dragMultiplier = lerp(0.008, 0.001, t);
        },
      },
    ],

    advMap: [
      { id: 'condensationRate', label: 'Tasa de condensación', min: 0.0005, max: 0.005, step: 0.0001,
        hint: 'Velocidad de formación de la niebla. Valores bajos dan niebla tenue.' },
      { id: 'waterWeight', label: 'Peso del agua en nube', min: 0.01, max: 0.5, step: 0.01,
        hint: 'Cuán pesadas son las gotas de niebla. Valores muy bajos = niebla que flota sin precipitar.' },
      { id: 'fallSpeed', label: 'Velocidad de caída', min: 0.00001, max: 0.0003, step: 0.00001,
        hint: 'Velocidad terminal de las microgotas. Muy bajo = niebla estacionaria.' },
      { id: 'globalDrying', label: 'Secado global', min: 0.0, max: 0.00005, step: 0.000001,
        hint: 'Añadir secado dispersa la niebla lentamente (simula el sol de la mañana).' },
    ],
  },

  // ── NEVADA ────────────────────────────────────────────────────────────
  {
    id: 'snowstorm',
    name: 'Nevada intensa',
    emoji: '❄',
    desc: 'Sistema frontal con precipitación de nieve. Temperatura bajo cero en toda la columna.',
    category: 'estable',
    difficulty: 'fácil',
    saveFile: './saves/Mountain Snow Storm.weathersandbox',
    resX: 200, resY: 300,

    guiBase: {
      condensationRate:  0.0055,
      waterEvaporation:  0.00008,
      landEvaporation:   0.00004,
      evapHeat:          2.90,
      meltingHeat:       0.43,
      waterWeight:       0.28,
      vorticity:         0.004,
      dragMultiplier:    0.002,
      wind:              0.06,
      soundingForcing:   0.05,
      globalDrying:      0.0,
      globalHeating:     0.0,
      spawnChance:       0.00004,
      fallSpeed:         0.00020,
      growthRate0C:      0.0003,
      growthRate_30C:    0.0008,
      snowDensity:       0.35,       // nieve ligera
      evapRate:          0.0006,
      aboveZeroThreshold: 1.0,
      subZeroThreshold:  0.003,
      freezingRate:      0.020,
      meltingRate:       0.005,      // funde lento en invierno
      waterTemperature:  2.0,        // agua fría
    },

    basicMap: [
      {
        id: 'intensity', label: 'Intensidad de nevada', min: 1, max: 10, defaultVal: 5,
        hint: 'Cantidad de nieve por hora. 10 = ventisca intensa.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.condensationRate = lerp(0.003, 0.009, t);
          gc.spawnChance      = lerp(0.00002, 0.00008, t);
          gc.growthRate0C     = lerp(0.0001, 0.0005, t);
        },
      },
      {
        id: 'fluffiness', label: 'Tipo de nieve', min: 1, max: 10, defaultVal: 5,
        hint: 'Nieve seca y ligera (1) vs nieve húmeda y pesada (10).',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.snowDensity = lerp(0.12, 0.55, t);   // ligera → pesada
          gc.fallSpeed   = lerp(0.00012, 0.00040, t);
          gc.meltingRate = lerp(0.003, 0.012, t); // nieve húmeda se derrite antes
        },
      },
      {
        id: 'wind', label: 'Viento (ventisca)', min: 1, max: 10, defaultVal: 3,
        hint: 'Viento que arrastra la nieve horizontalmente.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.wind = lerp(0.0, 0.18, t);
        },
      },
    ],

    advMap: [
      { id: 'snowDensity',  label: 'Densidad del copo',  min: 0.05, max: 0.80, step: 0.01,
        hint: 'Fracción de densidad: 0.1 = nieve muy seca y ligera, 0.8 = aguanieve compacta.' },
      { id: 'growthRate0C', label: 'Crecimiento de copo (0°C)', min: 0.00005, max: 0.001, step: 0.00005,
        hint: 'Velocidad de crecimiento de los copos justo en el nivel de congelación.' },
      { id: 'growthRate_30C', label: 'Crecimiento de copo (-30°C)', min: 0.0001, max: 0.003, step: 0.0001,
        hint: 'Crecimiento de cristales de hielo en la cima de la nube.' },
      { id: 'freezingRate', label: 'Tasa de congelación', min: 0.005, max: 0.05, step: 0.001,
        hint: 'Rapidez con la que la lluvia se convierte en nieve al subir de altitud.' },
      { id: 'meltingRate',  label: 'Tasa de fusión',     min: 0.001, max: 0.03, step: 0.001,
        hint: 'Velocidad de deshielo cerca del suelo. 0 = todo llega al suelo como nieve.' },
      { id: 'waterTemperature', label: 'Temperatura del agua (°C)', min: 0.0, max: 15.0, step: 0.5,
        hint: 'Temperatura de la superficie de agua/mar. Afecta a la cantidad de vapor generado.' },
    ],
  },

  // ── LÍNEA DE TURBONADA ────────────────────────────────────────────────
  {
    id: 'squall',
    name: 'Línea de turbonada',
    emoji: '🌪',
    desc: 'Sistema convectivo lineal organizado por alta cizalladura. Vientos fuertes en superficie.',
    category: 'storm',
    difficulty: 'avanzado',
    saveFile: './saves/480 km map with strong derecho.weathersandbox',
    resX: 250, resY: 300,

    guiBase: {
      condensationRate:  0.0070,
      waterEvaporation:  0.00015,
      landEvaporation:   0.00008,
      evapHeat:          3.10,
      meltingHeat:       0.50,
      waterWeight:       0.30,
      vorticity:         0.006,
      dragMultiplier:    0.0008,  // bajo drag = vientos superficiales más fuertes
      wind:              0.18,
      soundingForcing:   0.25,
      globalDrying:      0.0,
      globalHeating:     0.0,
      spawnChance:       0.00006,
      fallSpeed:         0.0004,
      growthRate0C:      0.00012,
      growthRate_30C:    0.0015,
      snowDensity:       0.18,
      evapRate:          0.0010,
      aboveZeroThreshold: 1.2,
      subZeroThreshold:  0.004,
    },

    basicMap: [
      {
        id: 'intensity', label: 'Intensidad', min: 1, max: 10, defaultVal: 7,
        hint: 'Fuerza general del sistema convectivo.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.condensationRate = lerp(0.004, 0.012, t);
          gc.soundingForcing  = lerp(0.10,  0.45,  t);
        },
      },
      {
        id: 'shear', label: 'Cizalladura vertical', min: 1, max: 10, defaultVal: 8,
        hint: 'Diferencia de viento entre el suelo y la troposfera. Más cizalladura = línea más organizada y dañina.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.wind           = lerp(0.05, 0.35, t);
          gc.dragMultiplier = lerp(0.002, 0.0005, t);
        },
      },
      {
        id: 'moisture', label: 'Humedad', min: 1, max: 10, defaultVal: 7,
        hint: 'Vapor de agua en la capa baja. Alimenta el sistema convectivo.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.waterEvaporation = lerp(0.00008, 0.00025, t);
          gc.landEvaporation  = lerp(0.00005, 0.00015, t);
        },
      },
    ],

    advMap: [
      { id: 'wind',             label: 'Viento (parámetro directo)', min: -1.0, max: 1.0, step: 0.01,
        hint: 'Control directo del viento horizontal del motor. Negativo = oeste, positivo = este.' },
      { id: 'dragMultiplier',   label: 'Multiplicador de arrastre', min: 0.0001, max: 0.01, step: 0.0001,
        hint: 'Resistencia del fluido. Bajo = vientos más fuertes y persistentes.' },
      { id: 'condensationRate', label: 'Tasa de condensación', min: 0.002, max: 0.020, step: 0.001,
        hint: 'Agresividad de la formación de nubes.' },
      { id: 'evapRate',         label: 'Tasa de evaporación de lluvia', min: 0.0001, max: 0.003, step: 0.0001,
        hint: 'Cuánta lluvia se evapora antes de llegar al suelo. Crea corrientes frías descendentes.' },
      { id: 'soundingForcing',  label: 'Forzado de sounding', min: 0.0, max: 1.0, step: 0.01,
        hint: 'Influencia del perfil atmosférico cargado.' },
      { id: 'vorticity',        label: 'Vorticidad', min: 0.0, max: 0.010, step: 0.001,
        hint: 'Rotación del fluido. Más = turbulencia más realista en los flancos.' },
    ],
  },

  // ── CÉLULAS MULTICÉLULA ───────────────────────────────────────────────
  {
    id: 'multicell',
    name: 'Tormenta multicélula',
    emoji: '⛅',
    desc: 'Grupo de células convectivas en distintas fases. Típica tarde de verano inestable.',
    category: 'storm',
    difficulty: 'medio',
    saveFile: './saves/Three Nice Cells.weathersandbox',
    resX: 200, resY: 300,

    guiBase: {
      condensationRate:  0.0055,
      waterEvaporation:  0.00012,
      landEvaporation:   0.00006,
      evapHeat:          2.90,
      meltingHeat:       0.43,
      waterWeight:       0.25,
      vorticity:         0.005,
      dragMultiplier:    0.001,
      wind:              0.03,
      soundingForcing:   0.08,
      globalDrying:      0.0,
      globalHeating:     0.0,
      spawnChance:       0.00005,
      fallSpeed:         0.00025,
      growthRate0C:      0.00010,
      growthRate_30C:    0.00090,
      snowDensity:       0.22,
      evapRate:          0.00075,
      aboveZeroThreshold: 1.0,
      subZeroThreshold:  0.005,
    },

    basicMap: [
      {
        id: 'instability', label: 'Inestabilidad', min: 1, max: 10, defaultVal: 6,
        hint: 'Cuán inestable está la atmósfera. Más inestabilidad = células más activas y frecuentes.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.condensationRate = lerp(0.003, 0.010, t);
          gc.soundingForcing  = lerp(0.0,   0.30,  t);
        },
      },
      {
        id: 'moisture', label: 'Humedad', min: 1, max: 10, defaultVal: 6,
        hint: 'Disponibilidad de vapor de agua. Alimenta cada célula individual.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.waterEvaporation = lerp(0.00006, 0.00022, t);
          gc.landEvaporation  = lerp(0.00003, 0.00012, t);
        },
      },
      {
        id: 'organisation', label: 'Organización', min: 1, max: 10, defaultVal: 4,
        hint: 'Cizalladura baja (1) = células desorganizadas y efímeras. Alta (10) = sistema bien organizado.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.wind     = lerp(0.0, 0.12, t);
          gc.vorticity = lerp(0.003, 0.008, t);
        },
      },
    ],

    advMap: [
      { id: 'condensationRate', label: 'Tasa de condensación', min: 0.001, max: 0.015, step: 0.001, hint: '' },
      { id: 'evapRate',         label: 'Evaporación de lluvia', min: 0.0002, max: 0.002, step: 0.0001, hint: 'Evaporación sub-nube que crea downdrafts y refuerza el frente de racha.' },
      { id: 'waterWeight',      label: 'Peso del agua en nube', min: 0.10, max: 0.60, step: 0.01, hint: 'Más peso → el aire húmedo sube menos → células más compactas.' },
      { id: 'vorticity',        label: 'Vorticidad', min: 0.0, max: 0.010, step: 0.001, hint: '' },
    ],
  },

  // ── DÍA DESPEJADO ─────────────────────────────────────────────────────
  {
    id: 'clearday',
    name: 'Día despejado',
    emoji: '☀',
    desc: 'Atmósfera estable con alta presión. Sin precipitación. Perfecto para observar la circulación general.',
    category: 'estable',
    difficulty: 'fácil',
    saveFile: null,
    resX: 150, resY: 300,

    guiBase: {
      condensationRate:  0.002,
      waterEvaporation:  0.00004,
      landEvaporation:   0.00002,
      evapHeat:          2.90,
      meltingHeat:       0.43,
      waterWeight:       0.20,
      vorticity:         0.003,
      dragMultiplier:    0.002,
      wind:              0.02,
      soundingForcing:   0.0,
      globalDrying:      0.000020,
      globalHeating:     0.0,
      spawnChance:       0.000005,
      fallSpeed:         0.0001,
      growthRate0C:      0.00005,
      growthRate_30C:    0.00005,
      snowDensity:       0.30,
      evapRate:          0.0010,
      aboveZeroThreshold: 2.0,
      subZeroThreshold:  0.05,
      sunIntensity:      1.3,
      waterTemperature:  28.0,
    },

    basicMap: [
      {
        id: 'temperature', label: 'Temperatura superficial', min: 1, max: 10, defaultVal: 7,
        hint: 'Cuán cálido es el día. Más calor puede generar pequeñas nubes de buen tiempo.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.waterTemperature = lerp(15.0, 35.0, t);
          gc.globalHeating    = lerp(0.0, 0.00020, t);
        },
      },
      {
        id: 'dryness', label: 'Sequedad del aire', min: 1, max: 10, defaultVal: 7,
        hint: 'Más seco = cielo más azul y limpio. Menos seco = pueden aparecer nubes de buen tiempo.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.globalDrying     = lerp(0.0, 0.00008, t);
          gc.landEvaporation  = lerp(0.00008, 0.000010, t);
          gc.waterEvaporation = lerp(0.00012, 0.000015, t);
        },
      },
      {
        id: 'wind', label: 'Brisa', min: 1, max: 10, defaultVal: 3,
        hint: 'Circulación suave en superficie. No genera tormentas pero da movimiento a la escena.',
        apply(v, gc) {
          const t = (v - 1) / 9;
          gc.wind = lerp(0.0, 0.08, t);
        },
      },
    ],

    advMap: [
      { id: 'globalDrying',   label: 'Secado global', min: 0.0, max: 0.0001, step: 0.000002, hint: 'Elimina humedad activamente. Mantén bajo 0°C el CAPE.' },
      { id: 'waterTemperature', label: 'Temperatura del agua (°C)', min: 10.0, max: 40.0, step: 0.5, hint: 'Temperatura superficial del mar/lago.' },
      { id: 'sunIntensity',   label: 'Intensidad solar', min: 0.5, max: 2.0, step: 0.05, hint: 'Multiplica la radiación solar entrante.' },
      { id: 'condensationRate', label: 'Tasa de condensación', min: 0.0005, max: 0.005, step: 0.0005, hint: 'Mantener bajo para evitar formación de nubes.' },
    ],
  },
];


// ---------------------------------------------------------------------------
//  2.  UTILIDADES
// ---------------------------------------------------------------------------

function lerp(a, b, t) {
  return a + (b - a) * Math.clamp01(t);
}

Math.clamp01 = (v) => Math.max(0, Math.min(1, v));

function applyPresetToGuiControls(preset, sliderValues) {
  // start from the preset's base
  const gc = Object.assign({}, preset.guiBase);

  // apply basic slider transformations
  for (const bm of preset.basicMap) {
    const val = sliderValues[bm.id] !== undefined ? sliderValues[bm.id] : bm.defaultVal;
    bm.apply(val, gc);
  }

  // apply advanced slider values (direct mapping)
  for (const am of preset.advMap) {
    if (sliderValues[am.id] !== undefined) {
      gc[am.id] = sliderValues[am.id];
    }
  }

  return gc;
}

// ---------------------------------------------------------------------------
//  3.  ESTADO GLOBAL DE LA UI
// ---------------------------------------------------------------------------

const UI = {
  selectedPreset: null,
  sliderValues: {},          // { sliderId: value }
  panelVisible: true,
  simRunning: false,
  activeTab: 'presets',      // 'presets' | 'basic' | 'advanced' | 'tools'
};

// ---------------------------------------------------------------------------
//  4.  INYECCIÓN DE ESTILOS
// ---------------------------------------------------------------------------

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* ── Reset parcial ── */
    #sui-root *, #sui-panel * { box-sizing: border-box; }

    /* ── Variables de color (dark theme para encajar con el fondo del simulador) ── */
    #sui-root {
      --sui-bg:        rgba(15, 15, 20, 0.92);
      --sui-bg2:       rgba(30, 30, 40, 0.85);
      --sui-bg3:       rgba(45, 45, 60, 0.80);
      --sui-border:    rgba(255,255,255,0.10);
      --sui-border2:   rgba(255,255,255,0.20);
      --sui-text:      #f0f0f0;
      --sui-text2:     #aaa;
      --sui-accent:    #4a90e2;
      --sui-accent2:   #2196F3;
      --sui-success:   #43a047;
      --sui-warning:   #fb8c00;
      --sui-danger:    #e53935;
      --sui-radius:    10px;
      --sui-radius-sm: 6px;
      --sui-fam:       'Segoe UI', system-ui, sans-serif;
      --sui-trans:     0.18s ease;
    }

    /* ── Panel flotante ── */
    #sui-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 340px;
      height: 100vh;
      background: var(--sui-bg);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-left: 1px solid var(--sui-border);
      font-family: var(--sui-fam);
      color: var(--sui-text);
      font-size: 13px;
      display: flex;
      flex-direction: column;
      z-index: 9999;
      transform: translateX(0);
      transition: transform var(--sui-trans);
      overflow: hidden;
    }
    #sui-panel.hidden { transform: translateX(100%); }

    /* ── Header ── */
    .sui-header {
      padding: 14px 16px 10px;
      border-bottom: 1px solid var(--sui-border);
      flex-shrink: 0;
    }
    .sui-header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .sui-title { font-size: 15px; font-weight: 600; color: var(--sui-text); }
    .sui-subtitle { font-size: 11px; color: var(--sui-text2); margin-top: 2px; }
    .sui-close-btn {
      background: none;
      border: 1px solid var(--sui-border2);
      color: var(--sui-text2);
      border-radius: var(--sui-radius-sm);
      cursor: pointer;
      padding: 4px 8px;
      font-size: 12px;
      transition: all var(--sui-trans);
    }
    .sui-close-btn:hover { background: var(--sui-bg3); color: var(--sui-text); }

    /* ── Tabs ── */
    .sui-tabs {
      display: flex;
      gap: 4px;
    }
    .sui-tab {
      flex: 1;
      padding: 6px 4px;
      background: none;
      border: 1px solid transparent;
      border-radius: var(--sui-radius-sm);
      color: var(--sui-text2);
      cursor: pointer;
      font-size: 11px;
      font-family: var(--sui-fam);
      text-align: center;
      transition: all var(--sui-trans);
    }
    .sui-tab:hover { background: var(--sui-bg3); color: var(--sui-text); }
    .sui-tab.active {
      background: var(--sui-bg3);
      border-color: var(--sui-border2);
      color: var(--sui-text);
      font-weight: 600;
    }

    /* ── Scroll area ── */
    .sui-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 12px 14px;
      scrollbar-width: thin;
      scrollbar-color: var(--sui-bg3) transparent;
    }
    .sui-scroll::-webkit-scrollbar { width: 4px; }
    .sui-scroll::-webkit-scrollbar-thumb { background: var(--sui-bg3); border-radius: 2px; }

    /* ── Section label ── */
    .sui-section-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--sui-text2);
      margin: 14px 0 8px;
    }
    .sui-section-label:first-child { margin-top: 0; }

    /* ── Preset cards ── */
    .sui-presets-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    .sui-preset-card {
      background: var(--sui-bg2);
      border: 1px solid var(--sui-border);
      border-radius: var(--sui-radius);
      padding: 10px 10px 8px;
      cursor: pointer;
      transition: all var(--sui-trans);
      position: relative;
      min-height: 80px;
    }
    .sui-preset-card:hover {
      border-color: var(--sui-border2);
      background: var(--sui-bg3);
    }
    .sui-preset-card.selected {
      border-color: var(--sui-accent);
      background: var(--sui-bg3);
    }
    .sui-preset-emoji { font-size: 20px; margin-bottom: 5px; line-height: 1; }
    .sui-preset-name { font-size: 12px; font-weight: 600; color: var(--sui-text); margin-bottom: 2px; line-height: 1.2; }
    .sui-preset-desc { font-size: 10px; color: var(--sui-text2); line-height: 1.3; }
    .sui-diff-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 99px;
      font-weight: 600;
    }
    .sui-diff-fácil    { background: rgba(67,160,71,0.25); color: #81c784; }
    .sui-diff-medio    { background: rgba(251,140,0,0.25);  color: #ffb74d; }
    .sui-diff-avanzado { background: rgba(229,57,53,0.25);  color: #ef9a9a; }

    /* ── Category filter ── */
    .sui-filter-row { display: flex; gap: 5px; margin-bottom: 10px; }
    .sui-filter-btn {
      padding: 4px 10px;
      border: 1px solid var(--sui-border);
      border-radius: 99px;
      background: none;
      color: var(--sui-text2);
      cursor: pointer;
      font-size: 11px;
      font-family: var(--sui-fam);
      transition: all var(--sui-trans);
    }
    .sui-filter-btn:hover { border-color: var(--sui-border2); color: var(--sui-text); }
    .sui-filter-btn.active { border-color: var(--sui-accent); color: var(--sui-accent); }

    /* ── Sliders ── */
    .sui-slider-row { margin-bottom: 12px; }
    .sui-slider-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .sui-slider-label { font-size: 12px; color: var(--sui-text); font-weight: 500; }
    .sui-slider-val {
      font-size: 12px;
      font-weight: 600;
      color: var(--sui-accent);
      min-width: 50px;
      text-align: right;
    }
    .sui-slider-hint { font-size: 10px; color: var(--sui-text2); margin-top: 3px; line-height: 1.4; }
    input[type=range].sui-slider {
      width: 100%;
      height: 4px;
      -webkit-appearance: none;
      appearance: none;
      background: var(--sui-bg3);
      border-radius: 2px;
      outline: none;
      cursor: pointer;
    }
    input[type=range].sui-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 14px; height: 14px;
      border-radius: 50%;
      background: var(--sui-accent);
      border: 2px solid #fff;
      cursor: pointer;
    }
    input[type=range].sui-slider::-moz-range-thumb {
      width: 14px; height: 14px;
      border-radius: 50%;
      background: var(--sui-accent);
      border: 2px solid #fff;
      cursor: pointer;
    }

    /* ── Advanced toggle ── */
    .sui-adv-toggle {
      width: 100%;
      background: none;
      border: 1px solid var(--sui-border);
      border-radius: var(--sui-radius-sm);
      color: var(--sui-text2);
      cursor: pointer;
      padding: 7px 10px;
      font-size: 11px;
      font-family: var(--sui-fam);
      text-align: left;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 8px 0;
      transition: all var(--sui-trans);
    }
    .sui-adv-toggle:hover { background: var(--sui-bg3); color: var(--sui-text); }
    .sui-adv-toggle .arrow { transition: transform 0.2s; }
    .sui-adv-toggle.open .arrow { transform: rotate(180deg); }

    .sui-adv-warn {
      background: rgba(251,140,0,0.12);
      border: 1px solid rgba(251,140,0,0.3);
      border-radius: var(--sui-radius-sm);
      padding: 8px 10px;
      font-size: 10px;
      color: #ffb74d;
      margin-bottom: 10px;
      line-height: 1.5;
    }

    /* ── Botones de acción ── */
    .sui-btn {
      width: 100%;
      padding: 10px;
      border: none;
      border-radius: var(--sui-radius);
      cursor: pointer;
      font-size: 13px;
      font-family: var(--sui-fam);
      font-weight: 600;
      transition: all var(--sui-trans);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .sui-btn-primary {
      background: var(--sui-accent);
      color: #fff;
    }
    .sui-btn-primary:hover { background: var(--sui-accent2); }
    .sui-btn-primary:disabled { background: var(--sui-bg3); color: var(--sui-text2); cursor: not-allowed; }
    .sui-btn-secondary {
      background: var(--sui-bg3);
      border: 1px solid var(--sui-border2);
      color: var(--sui-text);
    }
    .sui-btn-secondary:hover { background: var(--sui-bg2); }

    /* ── Footer del panel ── */
    .sui-footer {
      padding: 10px 14px;
      border-top: 1px solid var(--sui-border);
      flex-shrink: 0;
    }

    /* ── Info banner ── */
    .sui-info {
      background: var(--sui-bg2);
      border: 1px solid var(--sui-border);
      border-radius: var(--sui-radius-sm);
      padding: 8px 10px;
      font-size: 11px;
      color: var(--sui-text2);
      line-height: 1.5;
      margin-bottom: 10px;
    }
    .sui-info strong { color: var(--sui-text); }

    /* ── Botón flotante para mostrar panel ── */
    #sui-toggle-btn {
      position: fixed;
      top: 14px;
      right: 14px;
      z-index: 9998;
      background: rgba(15,15,20,0.90);
      border: 1px solid rgba(255,255,255,0.20);
      border-radius: var(--sui-radius);
      color: #f0f0f0;
      font-family: var(--sui-fam);
      font-size: 13px;
      padding: 8px 14px;
      cursor: pointer;
      backdrop-filter: blur(10px);
      transition: all 0.18s ease;
      display: none;
    }
    #sui-toggle-btn:hover { background: rgba(30,30,40,0.95); }

    /* ── Tools ── */
    .sui-tools-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px;
      margin-bottom: 10px;
    }
    .sui-tool-btn {
      background: var(--sui-bg2);
      border: 1px solid var(--sui-border);
      border-radius: var(--sui-radius-sm);
      color: var(--sui-text2);
      cursor: pointer;
      font-family: var(--sui-fam);
      font-size: 10px;
      padding: 8px 4px;
      text-align: center;
      transition: all var(--sui-trans);
      line-height: 1.3;
    }
    .sui-tool-btn:hover { background: var(--sui-bg3); color: var(--sui-text); border-color: var(--sui-border2); }
    .sui-tool-btn.active { border-color: var(--sui-accent); color: var(--sui-accent); }
    .sui-tool-icon { font-size: 16px; display: block; margin-bottom: 3px; }

    /* ── Intro screen reemplazado ── */
    #sui-launcher {
      min-height: 100vh;
      display: flex;
      align-items: stretch;
    }
    .sui-launcher-left {
      flex: 1;
      padding: 40px;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(6px);
      color: #fff;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .sui-launcher-left h1 {
      font-size: 2.2rem;
      font-weight: 700;
      margin: 0 0 8px;
      line-height: 1.1;
    }
    .sui-launcher-left p { color: rgba(255,255,255,0.7); font-size: 1rem; margin: 0 0 32px; }

    /* ── Paused overlay ── */
    #sui-paused-overlay {
      display: none;
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9997;
      background: rgba(229,57,53,0.85);
      color: #fff;
      padding: 6px 18px;
      border-radius: 99px;
      font-family: var(--sui-fam);
      font-size: 13px;
      font-weight: 600;
      backdrop-filter: blur(6px);
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
//  5.  PANTALLA DE LANZAMIENTO (reemplaza IntroScreen)
// ---------------------------------------------------------------------------

function buildLauncherHTML() {
  return `
<div id="sui-root" id="sui-launcher">
<div class="sui-launcher-left">
  <h1>Simulador<br>de tiempo</h1>
  <p>Elige un escenario y lanza la simulación.</p>

  <div style="margin-bottom:14px">
    <div class="sui-section-label">Categoría</div>
    <div class="sui-filter-row">
      <button class="sui-filter-btn active" onclick="suiFilterPresets('all',this)">Todos</button>
      <button class="sui-filter-btn" onclick="suiFilterPresets('storm',this)">Tormentas</button>
      <button class="sui-filter-btn" onclick="suiFilterPresets('estable',this)">Estables</button>
    </div>
  </div>

  <div class="sui-section-label">Escenario</div>
  <div class="sui-presets-grid" id="sui-launcher-grid" style="max-width:640px"></div>

  <div style="margin-top:24px;max-width:640px">
    <div class="sui-section-label">Resolución</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px">
      <div>
        <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px">Resolución X</div>
        <input type="range" class="sui-slider" id="launcher-resX" min="50" max="400" step="10" value="200"
          oninput="document.getElementById('launcher-resX-val').textContent=this.value">
        <span id="launcher-resX-val" style="font-size:12px;color:#4a90e2">200</span>
      </div>
      <div>
        <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px">Resolución Y</div>
        <input type="range" class="sui-slider" id="launcher-resY" min="100" max="500" step="10" value="300"
          oninput="document.getElementById('launcher-resY-val').textContent=this.value">
        <span id="launcher-resY-val" style="font-size:12px;color:#4a90e2">300</span>
      </div>
      <div>
        <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px">Altura sim (m)</div>
        <input type="range" class="sui-slider" id="launcher-height" min="5000" max="15000" step="500" value="12000"
          oninput="document.getElementById('launcher-height-val').textContent=this.value">
        <span id="launcher-height-val" style="font-size:12px;color:#4a90e2">12000</span>
      </div>
    </div>

    <button class="sui-btn sui-btn-primary" id="sui-launch-btn"
      onclick="suiLaunchSimulation()"
      style="max-width:320px;font-size:15px;padding:13px"
      disabled>
      Selecciona un escenario
    </button>
    <div style="margin-top:10px;font-size:11px;color:rgba(255,255,255,0.5)">
      Recomendado: Y=300, GPU GTX 1070 o superior &nbsp;·&nbsp; F11 para pantalla completa
    </div>
  </div>
</div>
</div>`;
}

// ---------------------------------------------------------------------------
//  6.  PANEL DE CONTROL (visible sobre el canvas durante la simulación)
// ---------------------------------------------------------------------------

function buildControlPanel() {
  const panel = document.createElement('div');
  panel.id = 'sui-panel';
  panel.innerHTML = `
    <div class="sui-header">
      <div class="sui-header-top">
        <div>
          <div class="sui-title" id="sui-panel-title">Simulador de tiempo</div>
          <div class="sui-subtitle" id="sui-panel-sub">Selecciona un preset arriba</div>
        </div>
        <button class="sui-close-btn" onclick="suiTogglePanel()">Ocultar</button>
      </div>
      <div class="sui-tabs">
        <button class="sui-tab active" onclick="suiShowTab('basic')">Básico</button>
        <button class="sui-tab" onclick="suiShowTab('advanced')">Avanzado</button>
        <button class="sui-tab" onclick="suiShowTab('tools')">Herramientas</button>
      </div>
    </div>
    <div class="sui-scroll" id="sui-panel-body"></div>
    <div class="sui-footer" id="sui-panel-footer"></div>
  `;
  document.body.appendChild(panel);
}

// ---------------------------------------------------------------------------
//  7.  RENDERIZADO DE CONTENIDO DEL PANEL
// ---------------------------------------------------------------------------

function suiShowTab(tab) {
  UI.activeTab = tab;
  document.querySelectorAll('#sui-panel .sui-tab').forEach((el, i) => {
    el.classList.toggle('active', ['basic','advanced','tools'][i] === tab);
  });
  suiRenderPanelBody();
}

function suiRenderPanelBody() {
  const body   = document.getElementById('sui-panel-body');
  const footer = document.getElementById('sui-panel-footer');
  if (!body) return;

  const preset = UI.selectedPreset;

  if (UI.activeTab === 'basic') {
    if (!preset) {
      body.innerHTML = `<div class="sui-info">No hay ningún preset activo. La simulación está usando los valores por defecto.</div>`;
      footer.innerHTML = '';
      return;
    }
    let html = `<div class="sui-info"><strong>${preset.emoji} ${preset.name}</strong><br>${preset.desc}</div>`;
    html += `<div class="sui-section-label">Ajustes principales</div>`;
    for (const bm of preset.basicMap) {
      const val = UI.sliderValues[bm.id] !== undefined ? UI.sliderValues[bm.id] : bm.defaultVal;
      html += renderSimpleSlider(bm, val);
    }
    body.innerHTML = html;
    footer.innerHTML = `<button class="sui-btn sui-btn-primary" onclick="suiApplyCurrentSettings()">⟳ Aplicar cambios</button>`;

  } else if (UI.activeTab === 'advanced') {
    if (!preset) {
      body.innerHTML = `<div class="sui-info">Selecciona un preset primero para ver los parámetros avanzados.</div>`;
      footer.innerHTML = '';
      return;
    }
    let html = `<div class="sui-adv-warn">
      ⚠ Parámetros del motor de simulación. Valores fuera de rango pueden producir resultados inesperados.
    </div>`;
    html += `<div class="sui-section-label">Parámetros avanzados — ${preset.name}</div>`;
    for (const am of preset.advMap) {
      const gc = window.guiControls || {};
      const current = UI.sliderValues[am.id] !== undefined
        ? UI.sliderValues[am.id]
        : (gc[am.id] !== undefined ? gc[am.id] : preset.guiBase[am.id] || am.min);
      html += renderAdvSlider(am, current);
    }
    body.innerHTML = html;
    footer.innerHTML = `
      <button class="sui-btn sui-btn-primary" onclick="suiApplyCurrentSettings()" style="margin-bottom:6px">⟳ Aplicar cambios</button>
      <button class="sui-btn sui-btn-secondary" onclick="suiResetToPresetBase()">↺ Resetear al preset</button>
    `;

  } else if (UI.activeTab === 'tools') {
    body.innerHTML = renderToolsTab();
    footer.innerHTML = '';
  }

  // Wire up sliders
  body.querySelectorAll('input[type=range][data-sid]').forEach(input => {
    input.addEventListener('input', () => {
      const sid = input.dataset.sid;
      const val = parseFloat(input.value);
      UI.sliderValues[sid] = val;
      const disp = document.getElementById('sui-val-' + sid);
      if (disp) disp.textContent = formatSliderVal(val, input.dataset.decimals || 0);
    });
  });
}

function renderSimpleSlider(bm, val) {
  const decimals = 0;
  return `
  <div class="sui-slider-row">
    <div class="sui-slider-header">
      <span class="sui-slider-label">${bm.label}</span>
      <span class="sui-slider-val" id="sui-val-${bm.id}">${formatSliderVal(val, decimals)}</span>
    </div>
    <input type="range" class="sui-slider" data-sid="${bm.id}" data-decimals="${decimals}"
      min="${bm.min}" max="${bm.max}" step="1" value="${val}">
    <div class="sui-slider-hint">${bm.hint}</div>
  </div>`;
}

function renderAdvSlider(am, val) {
  const step = am.step || 0.001;
  const decimals = Math.max(0, -Math.floor(Math.log10(step)));
  return `
  <div class="sui-slider-row">
    <div class="sui-slider-header">
      <span class="sui-slider-label">${am.label}</span>
      <span class="sui-slider-val" id="sui-val-${am.id}">${formatSliderVal(val, decimals)}</span>
    </div>
    <input type="range" class="sui-slider" data-sid="${am.id}" data-decimals="${decimals}"
      min="${am.min}" max="${am.max}" step="${step}" value="${val}">
    ${am.hint ? `<div class="sui-slider-hint">${am.hint}</div>` : ''}
  </div>`;
}

function renderToolsTab() {
  const tools = [
    { key: 'TOOL_HEAT',     label: 'Calentar',      icon: '🌡' },
    { key: 'TOOL_MOISTURE', label: 'Humedad',        icon: '💧' },
    { key: 'TOOL_WIND',     label: 'Viento',         icon: '🌬' },
    { key: 'TOOL_FIRE',     label: 'Fuego',          icon: '🔥' },
    { key: 'TOOL_SMOKE',    label: 'Humo',           icon: '💨' },
    { key: 'TOOL_RAIN',     label: 'Lluvia forzada', icon: '🌧' },
    { key: 'TOOL_STATION',  label: 'Estación',       icon: '📡' },
    { key: 'TOOL_NONE',     label: 'Sin herramienta',icon: '🖱' },
  ];
  const gc = window.guiControls || {};

  let toolsHtml = '<div class="sui-section-label">Herramienta activa</div>';
  toolsHtml += '<div class="sui-tools-grid">';
  for (const t of tools) {
    const active = gc.tool === t.key ? 'active' : '';
    toolsHtml += `<button class="sui-tool-btn ${active}" onclick="suiSetTool('${t.key}')">
      <span class="sui-tool-icon">${t.icon}</span>${t.label}
    </button>`;
  }
  toolsHtml += '</div>';

  toolsHtml += `
  <div class="sui-section-label">Pincel</div>
  <div class="sui-slider-row">
    <div class="sui-slider-header">
      <span class="sui-slider-label">Tamaño</span>
      <span class="sui-slider-val" id="sui-brush-size-val">${Math.round(gc.brushSize || 20)}</span>
    </div>
    <input type="range" class="sui-slider" min="1" max="200" step="1" value="${gc.brushSize || 20}"
      oninput="suiSetBrushSize(this.value)">
  </div>
  <div class="sui-slider-row">
    <div class="sui-slider-header">
      <span class="sui-slider-label">Intensidad</span>
      <span class="sui-slider-val" id="sui-brush-int-val">${((gc.brushIntensity || 0.01) * 100).toFixed(0)}%</span>
    </div>
    <input type="range" class="sui-slider" min="5" max="50" step="1" value="${Math.round((gc.brushIntensity||0.01)*1000)}"
      oninput="suiSetBrushIntensity(this.value)">
  </div>

  <div class="sui-section-label">Reproducción</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
    <button class="sui-btn sui-btn-secondary" onclick="suiTogglePause()">⏯ Pausa</button>
    <button class="sui-btn sui-btn-secondary" onclick="suiSaveSimulation()">💾 Guardar</button>
  </div>

  <div class="sui-section-label">Visualización</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">
    <button class="sui-btn sui-btn-secondary" onclick="suiSetDisplayMode('DISP_REAL')">Real</button>
    <button class="sui-btn sui-btn-secondary" onclick="suiSetDisplayMode('DISP_TEMP')">Temperatura</button>
    <button class="sui-btn sui-btn-secondary" onclick="suiSetDisplayMode('DISP_HUMIDITY')">Humedad rel.</button>
    <button class="sui-btn sui-btn-secondary" onclick="suiSetDisplayMode('DISP_WIND')">Viento</button>
  </div>
  `;

  return toolsHtml;
}

function formatSliderVal(val, decimals) {
  return parseFloat(val).toFixed(parseInt(decimals));
}

// ---------------------------------------------------------------------------
//  8.  LÓGICA DEL LAUNCHER
// ---------------------------------------------------------------------------

let _currentLauncherFilter = 'all';

window.suiFilterPresets = function(cat, btn) {
  _currentLauncherFilter = cat;
  document.querySelectorAll('.sui-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderLauncherGrid();
};

function renderLauncherGrid() {
  const grid = document.getElementById('sui-launcher-grid');
  if (!grid) return;
  const list = _currentLauncherFilter === 'all'
    ? STORM_PRESETS
    : STORM_PRESETS.filter(p => p.category === _currentLauncherFilter);

  grid.innerHTML = list.map(p => `
    <div class="sui-preset-card ${UI.selectedPreset?.id === p.id ? 'selected' : ''}"
      onclick="suiSelectPreset('${p.id}')">
      <span class="sui-diff-badge sui-diff-${p.difficulty}">${p.difficulty}</span>
      <div class="sui-preset-emoji">${p.emoji}</div>
      <div class="sui-preset-name">${p.name}</div>
      <div class="sui-preset-desc">${p.desc.slice(0, 60)}…</div>
    </div>`).join('');
}

window.suiSelectPreset = function(id) {
  UI.selectedPreset = STORM_PRESETS.find(p => p.id === id);
  // Init slider values from defaults
  UI.sliderValues = {};
  if (UI.selectedPreset) {
    for (const bm of UI.selectedPreset.basicMap) {
      UI.sliderValues[bm.id] = bm.defaultVal;
    }
    // Set resolution sliders
    const resX = document.getElementById('launcher-resX');
    const resY = document.getElementById('launcher-resY');
    if (resX) { resX.value = UI.selectedPreset.resX; document.getElementById('launcher-resX-val').textContent = UI.selectedPreset.resX; }
    if (resY) { resY.value = UI.selectedPreset.resY; document.getElementById('launcher-resY-val').textContent = UI.selectedPreset.resY; }
  }

  const btn = document.getElementById('sui-launch-btn');
  if (btn) {
    btn.disabled = !UI.selectedPreset;
    btn.textContent = UI.selectedPreset ? `▶  Lanzar "${UI.selectedPreset.name}"` : 'Selecciona un escenario';
  }
  renderLauncherGrid();
};

window.suiLaunchSimulation = async function() {
  if (!UI.selectedPreset) return;
  const preset = UI.selectedPreset;

  // Build the guiControls overrides from current slider values
  const gcOverrides = applyPresetToGuiControls(preset, UI.sliderValues);
  window._stormUIOverrides = gcOverrides;

  // Update resolution inputs so loadData() picks them up
  const resX   = document.getElementById('launcher-resX');
  const resY   = document.getElementById('launcher-resY');
  const height = document.getElementById('launcher-height');

  // These IDs must match the original index.html inputs
  const simResX   = document.getElementById('simResSelX');
  const simResY   = document.getElementById('simResSelY');
  const simHeight = document.getElementById('simHeightSel');
  if (simResX && resX)   simResX.value   = resX.value;
  if (simResY && resY)   simResY.value   = resY.value;
  if (simHeight && height) simHeight.value = height.value;

  if (preset.saveFile) {
    // Load save file programmatically
    await suiLoadSaveFile(preset.saveFile);
  } else {
    // New simulation
    loadData();
  }
};

async function suiLoadSaveFile(url) {
  const btn = document.getElementById('sui-launch-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Cargando...'; }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('No se pudo cargar el archivo: ' + url);
    const blob = await response.blob();
    const filename = url.split('/').pop();
    const file = new File([blob], filename);

    // Inject file into fileInput using DataTransfer
    const dt = new DataTransfer();
    dt.items.add(file);
    const fileInput = document.getElementById('fileInput');
    fileInput.files = dt.files;

    loadData();
  } catch (err) {
    console.error('stormui: error cargando save file', err);
    // Fallback: new simulation with overrides
    if (btn) { btn.disabled = false; btn.textContent = `▶  Lanzar sin archivo guardado`; }
    loadData();
  }
}

// ---------------------------------------------------------------------------
//  9.  ACCIONES DEL PANEL DE CONTROL (durante la simulación)
// ---------------------------------------------------------------------------

window.suiApplyCurrentSettings = function() {
  if (!UI.selectedPreset || !window.guiControls) return;
  const newVals = applyPresetToGuiControls(UI.selectedPreset, UI.sliderValues);
  Object.assign(window.guiControls, newVals);
  window.setGuiUniforms && window.setGuiUniforms();

  // Flash feedback
  const btn = document.querySelector('#sui-panel-footer .sui-btn-primary');
  if (btn) {
    const orig = btn.textContent;
    btn.textContent = '✓ Aplicado';
    btn.style.background = '#43a047';
    setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 1200);
  }
};

window.suiResetToPresetBase = function() {
  if (!UI.selectedPreset || !window.guiControls) return;
  // Reset slider values to defaults
  for (const bm of UI.selectedPreset.basicMap) UI.sliderValues[bm.id] = bm.defaultVal;
  for (const am of UI.selectedPreset.advMap)   delete UI.sliderValues[am.id];
  Object.assign(window.guiControls, UI.selectedPreset.guiBase);
  window.setGuiUniforms && window.setGuiUniforms();
  suiRenderPanelBody();
};

window.suiTogglePause = function() {
  if (!window.guiControls) return;
  window.guiControls.paused = !window.guiControls.paused;
  window.handlePause && window.handlePause();
  const overlay = document.getElementById('sui-paused-overlay');
  if (overlay) overlay.style.display = window.guiControls.paused ? 'block' : 'none';
};

window.suiSaveSimulation = function() {
  if (!window.guiControls) return;
  window.guiControls.download && window.guiControls.download();
};

window.suiSetTool = function(toolKey) {
  if (!window.guiControls) return;
  window.guiControls.tool = toolKey;
  // Re-render tools tab to update active state
  suiShowTab('tools');
};

window.suiSetBrushSize = function(val) {
  if (!window.guiControls) return;
  window.guiControls.brushSize = parseInt(val);
  const disp = document.getElementById('sui-brush-size-val');
  if (disp) disp.textContent = val;
};

window.suiSetBrushIntensity = function(val) {
  if (!window.guiControls) return;
  window.guiControls.brushIntensity = parseInt(val) / 1000;
  const disp = document.getElementById('sui-brush-int-val');
  if (disp) disp.textContent = Math.round(parseInt(val) / 10) + '%';
};

window.suiSetDisplayMode = function(mode) {
  if (!window.guiControls) return;
  window.guiControls.displayMode = mode;
};

window.suiTogglePanel = function() {
  const panel = document.getElementById('sui-panel');
  const toggleBtn = document.getElementById('sui-toggle-btn');
  UI.panelVisible = !UI.panelVisible;
  if (panel) panel.classList.toggle('hidden', !UI.panelVisible);
  if (toggleBtn) toggleBtn.style.display = UI.panelVisible ? 'none' : 'block';
};

// ---------------------------------------------------------------------------
//  10.  OBSERVADOR: detectar cuándo la simulación ha arrancado
// ---------------------------------------------------------------------------

function watchForSimulationStart() {
  const observer = new MutationObserver(() => {
    const canvas = document.getElementById('mainCanvas');
    if (canvas && canvas.style.display === 'block') {
      observer.disconnect();
      onSimulationStarted();
    }
  });
  observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['style'] });
}

function onSimulationStarted() {
  UI.simRunning = true;

  // Build control panel
  buildControlPanel();

  // Add the hidden toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'sui-toggle-btn';
  toggleBtn.textContent = '⚙ Panel';
  toggleBtn.onclick = suiTogglePanel;
  document.body.appendChild(toggleBtn);

  // Paused overlay
  const pausedOverlay = document.createElement('div');
  pausedOverlay.id = 'sui-paused-overlay';
  pausedOverlay.textContent = '⏸ PAUSADO — Pulsa Espacio o el botón en Herramientas';
  document.body.appendChild(pausedOverlay);

  // Update panel header
  const titleEl = document.getElementById('sui-panel-title');
  const subEl   = document.getElementById('sui-panel-sub');
  if (UI.selectedPreset && titleEl) titleEl.textContent = UI.selectedPreset.name;
  if (UI.selectedPreset && subEl)   subEl.textContent   = UI.selectedPreset.emoji + ' ' + UI.selectedPreset.difficulty;

  // Sync guiControls reference (may have been re-created inside mainScript)
  // Poll briefly to make sure window.guiControls is live
  let attempts = 0;
  const poller = setInterval(() => {
    attempts++;
    if (window.setGuiUniforms || attempts > 40) {
      clearInterval(poller);
      // Apply any outstanding overrides
      if (window._stormUIOverrides && window.guiControls) {
        Object.assign(window.guiControls, window._stormUIOverrides);
        window._stormUIOverrides = null;
        window.setGuiUniforms && window.setGuiUniforms();
      }
      suiShowTab('basic');
    }
  }, 250);

  // H key now also toggles our panel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'h' || e.key === 'H') {
      // DatGui handles its own H toggle internally; we mirror it
      suiTogglePanel();
    }
  }, true);
}

// ---------------------------------------------------------------------------
//  11.  INICIALIZACIÓN
// ---------------------------------------------------------------------------

function suiInit() {
  injectStyles();

  // Replace IntroScreen content with launcher
  const introScreen = document.getElementById('IntroScreen');
  if (introScreen) {
    introScreen.innerHTML = buildLauncherHTML();
    // re-assign id to sui-root for var scoping
    const root = introScreen.querySelector('#sui-root');
    if (root) root.id = 'sui-root';
    else introScreen.id = 'sui-root';
    renderLauncherGrid();
  }

  watchForSimulationStart();
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', suiInit);
} else {
  suiInit();
}
