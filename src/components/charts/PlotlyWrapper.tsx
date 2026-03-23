// @ts-ignore - CJS/ESM interop: factory may export as default or named
import factoryModule from 'react-plotly.js/factory';
// @ts-ignore - plotly.js/dist/plotly doesn't have type declarations
import Plotly from 'plotly.js/dist/plotly';

/**
 * Create the Plot component using the factory pattern.
 * This approach works reliably with Vite's ESM handling,
 * avoiding CJS/ESM interop issues with the default export.
 */
const createPlotlyComponent = typeof factoryModule === 'function'
  ? factoryModule
  : (factoryModule as any).default;

const Plot = createPlotlyComponent(Plotly);

export default Plot;
