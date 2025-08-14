import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { Auth } from "@angular/fire/auth";

/**
 * AuthGuard function to protect routes from unauthorized access
 * Implements Angular's CanActivateFn
 */
export const AuthGuard: CanActivateFn = async () => {
    // Inject the Firebase Auth service
    const auth = inject(Auth);

    // Inject the Angular Router
    const router = inject(Router);

    // Return a promise that resolves to true if the user is authenticated
    return new Promise<boolean>((resolve) => {
        // Listen for authentication state changes
        auth.onAuthStateChanged(user => {
            if (user) {
                // User is logged in, allow route activation
                resolve(true);
            } else {
                // User is not logged in, redirect to home page
                router.navigate(['/']);
                resolve(false);
            }
        });
    });
};
