import { Injectable, NgZone } from '@angular/core';
import { doc, Firestore,updateDoc } from '@angular/fire/firestore';
import {ref, onDisconnect, set, serverTimestamp as rtdbTimestamp, serverTimestamp} from 'firebase/database';
import { Database, get, onValue } from '@angular/fire/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
  constructor(private firestore: Firestore , private db: Database,  private zone: NgZone){}

  async initPresence(user:any){
    const userRef = doc(this.firestore, `users/${user.uid}`);

    if(!user) return;
    const statusRef = ref(this.db, `/status/${user.uid}`);
    const snapshot = await get(statusRef);
    const forcedClose = snapshot.exists() && snapshot.val().forcedClose === true;
    if (forcedClose) return; 

        await set(statusRef, {
      state: 'online',
      forcedClose: false,
      lastChanged: rtdbTimestamp()
    });
    
          onDisconnect(statusRef).set({
      state: 'offline',
      forcedClose: true,
      lastChanged: rtdbTimestamp()
    });

  }

  setOffline(user:any){
    if(!user) return;
    const statusRef = ref(this.db, `/status/${user.uid}`);
    set(statusRef, { state: 'offline', forcedClose: false, lastChanged: rtdbTimestamp() });
    const userRef = doc(this.firestore, `users/${user.uid}`);
    updateDoc(userRef, { active: false, lastActive: serverTimestamp() });
  }

  setOfflineSync(user: any) {
  if (!user) return;
  const statusRef = ref(this.db, `/status/${user.uid}`);
  set(statusRef, {
    state: 'offline',
    forcedClose: false,
    lastChanged: rtdbTimestamp()
  });
      const userRef = doc(this.firestore, `users/${user.uid}`);
      updateDoc(userRef, { active: false, lastActive: serverTimestamp() });
  }


async checkForcedClose(user: any): Promise<boolean> {
  if (!user) return false;
  const statusRef = ref(this.db, `/status/${user.uid}`);
  const snapshot = await get(statusRef);
  if(!snapshot.exists()) return false;

  const val = snapshot.val();

  const lastChanged = val.lastChanged;
  const now = Date.now();

  if(val.forcedClose && now - lastChanged > 5000){
    return true;
  }
  return false;
}

  getUserStatus(uid: string): Observable<any> {
    const statusRef = ref(this.db, `/status/${uid}`);
    return new Observable((observer) => {
      const unsubscribe = onValue(
        statusRef,
        (snapshot) => {
          this.zone.run(() => observer.next(snapshot.val()));
        },
        (error) => this.zone.run(() => observer.error(error))
      );
      return () => unsubscribe();
    });
  }

}
