import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { Auth } from "@angular/fire/auth";

/**
 * AuthGuard function to protect routes from unauthorized access
 * Implements Angular's CanActivateFn
 */
export const AuthGuard: CanActivateFn = async () => {
    const auth = inject(Auth);
    const router = inject(Router);
    return new Promise<boolean>((resolve) => {
        auth.onAuthStateChanged(user => {
            if (user) {
                resolve(true);
            } else {
                router.navigate(['/']);
                resolve(false);
            }
        });
    });
};
