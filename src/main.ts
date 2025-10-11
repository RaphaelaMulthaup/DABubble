import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app';
import {
  provideFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  initializeFirestore,
} from '@angular/fire/firestore';
import { environment } from './environments/environment';
import { provideAuth, getAuth } from '@angular/fire/auth';

import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { importProvidersFrom } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';

// Bootstraps the Angular application with the root component
bootstrapApplication(AppComponent, {
  providers: [
    // Provides the Angular router with the defined routes
    provideRouter(routes),

    // Initializes Firebase app with environment-specific configuration
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),

    // Provides Firestore instance for dependency injection
    provideFirestore(() =>
      initializeFirestore(getApp(), {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      })
    ),

    // Provides Firebase Authentication instance for dependency injection
    provideAuth(() => getAuth()),

    // Add additional providers here if needed
    importProvidersFrom(HttpClientModule),
  ],
})
  // Catches and logs any errors during application bootstrap
  .catch((err) => console.error(err));
