import { CanActivateFn, Router } from "@angular/router";
import { inject } from "@angular/core";
import { Auth } from "@angular/fire/auth";

export const AuthGuard: CanActivateFn = async () => {
    const auth = inject(Auth);
    const router = inject(Router);
        return new Promise<boolean>((resolve) => {
            auth.onAuthStateChanged(user => {
                if (user) {
                    resolve(true);
                } else {
                    router.navigate(['/login']);
                    resolve(false);
                }
                });
            }
        );
};