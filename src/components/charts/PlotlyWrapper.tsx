import type { ComponentType } from 'react';

import factoryModule from 'react-plotly.js/factory';
// @ts-expect-error - plotly.js/dist/plotly doesn't have type declarations
import Plotly from 'plotly.js/dist/plotly';

/**
 * Create the Plot component using the factory pattern.
 * This approach works reliably with Vite's ESM handling,
 * avoiding CJS/ESM interop issues with the default export.
 */
type PlotComponent = ComponentType<Record<string, unknown>>;
type PlotFactory = (plotly: unknown) => PlotComponent;

type PlotFactoryModule =
  | PlotFactory
  | {
    default?: PlotFactory;
  };

const factoryCandidate = factoryModule as unknown as PlotFactoryModule;

const createPlotlyComponent: PlotFactory =
  typeof factoryCandidate === 'function'
    ? factoryCandidate
    : factoryCandidate.default ??
      (() => {
        throw new Error('No se pudo inicializar react-plotly.js/factory.');
      });

const Plot = createPlotlyComponent(Plotly);

export default Plot;
