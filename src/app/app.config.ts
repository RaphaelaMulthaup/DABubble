import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

/**
 * Application configuration for the Angular app
 * - Enables zone change detection with event coalescing
 * - Provides router configuration with defined routes
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Enables Angular's zone-based change detection with event coalescing to improve performance
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Provides router configuration with the application's routes
    provideRouter(routes)
  ]
};
