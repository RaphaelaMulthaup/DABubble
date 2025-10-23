import { Injectable, NgZone } from '@angular/core';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { ref, onDisconnect, set, serverTimestamp } from 'firebase/database';
import { Database, get, onValue } from '@angular/fire/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PresenceService {
  private ONLINE_TIMEOUT = 5000;

  constructor(
    private db: Database,
    private firestore: Firestore,
    private zone: NgZone
  ) {}

  /**
   * Initializes the user's online presence and sets up automatic offline handling on disconnect.
   * 
   * @param user - The user object containing the UID
   */
  async initPresence(user: any) {
    if (!user) return;
    const statusRef = ref(this.db, `/status/${user.uid}`);
    const userRef = doc(this.firestore, `users/${user.uid}`);
    await set(statusRef, { state: 'online', forcedClose: false, lastChanged: Date.now()});
    await updateDoc(userRef, { active: true, lastActive: serverTimestamp()});
    onDisconnect(statusRef).set({ state: 'offline', forcedClose: true, lastChanged: Date.now()});
  }

  /**
   * Sets the user's status to offline in both Realtime Database and Firestore.
   * 
   * @param user - The user object containing the UID
   */
  async setOffline(user: any) {
    if (!user) return;
    const statusRef = ref(this.db, `/status/${user.uid}`);
    const userRef = doc(this.firestore, `users/${user.uid}`);
    await set(statusRef, { state: 'offline', forcedClose: false, lastChanged: Date.now()});
    await updateDoc(userRef, { active: false, lastActive: serverTimestamp() });
  }

  /**
   * Checks whether a user is currently considered online based on their last status update.
   * 
   * @param status - The user's status object from the Realtime Database
   */
  isUserOnline(status: any) {
    if (!status) return false;
    return Date.now() - status.lastChanged < this.ONLINE_TIMEOUT;
  }

/**
 * Checks if the user was forcibly disconnected (e.g., unexpected tab close).
 * 
 * @param user - The user object containing the UID
 */
  async checkForcedClose(user: any): Promise<boolean> {
    if (!user) return false;
    const statusRef = ref(this.db, `/status/${user.uid}`);
    const snapshot = await get(statusRef);
    if (!snapshot.exists()) return false;
    const val = snapshot.val();
    const now = Date.now();
    return val.forcedClose && now - val.lastChanged > 3600000;
  }

  /**
   * Observes and emits real-time updates of a user's presence status.
   * 
   * @param uid - The user ID whose status should be observed
   */
  getUserStatus(uid: string): Observable<any> {
    const statusRef = ref(this.db, `/status/${uid}`);
    return new Observable((observer) => {
      const unsubscribe = onValue(statusRef,
        (snapshot) => {this.zone.run(() => observer.next(snapshot.val()))},
        (error) => this.zone.run(() => observer.error(error))
      );
      return () => unsubscribe();
    });
  }
}