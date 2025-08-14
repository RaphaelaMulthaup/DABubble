import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { environment } from './environments/environment';
import { provideAuth, getAuth } from '@angular/fire/auth';

import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

// Bootstraps the Angular application with the root component
bootstrapApplication(AppComponent, {
  providers: [
    // Provides the Angular router with the defined routes
    provideRouter(routes),

    // Initializes Firebase app with environment-specific configuration
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),

    // Provides Firestore instance for dependency injection
    provideFirestore(() => getFirestore()),

    // Provides Firebase Authentication instance for dependency injection
    provideAuth(() => getAuth()),

    // Add additional providers here if needed
  ]
})
// Catches and logs any errors during application bootstrap
.catch((err) => console.error(err));
