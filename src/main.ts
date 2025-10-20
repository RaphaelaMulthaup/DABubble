import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app';
import {
  provideFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  initializeFirestore,
} from '@angular/fire/firestore';
import { environment } from './environments/environment';
import { provideAuth, getAuth } from '@angular/fire/auth';

import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { importProvidersFrom } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { provideDatabase, getDatabase } from '@angular/fire/database';


bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideFirestore(() =>
      initializeFirestore(getApp(), {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      })
    ),
    provideAuth(() => getAuth()),
    provideDatabase(() => getDatabase(getApp(), environment.firebaseConfig.databaseURL)),
    importProvidersFrom(HttpClientModule),
  ],
})
  .catch((err) => console.error(err));
