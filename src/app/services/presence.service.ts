import { Injectable, NgZone } from '@angular/core';
import { doc, Firestore,updateDoc } from '@angular/fire/firestore';
import {ref, onDisconnect, set, serverTimestamp as rtdbTimestamp, serverTimestamp} from 'firebase/database';
import { Database, get, onValue } from '@angular/fire/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
  private ONLINE_TIMEOUT = 5000;
  constructor(private firestore: Firestore , private db: Database,  private zone: NgZone){}

  async initPresence(user:any){
    if(!user) return;


    const statusRef = ref(this.db, `/status/${user.uid}`);
    const userRef = doc(this.firestore, `users/${user.uid}`);


    // const snapshot = await get(statusRef);
    // const forcedClose = snapshot.exists() && snapshot.val().forcedClose === true;

    // if (forcedClose) return; 
    await set(statusRef, {
      state: 'online',
      forcedClose: false,
      lastChanged: Date.now()
    });

        await updateDoc(userRef, {
      active: true,
      lastActive: serverTimestamp()
    });

    onDisconnect(statusRef).set({
      state: 'offline',
      forcedClose: true,
      lastChanged: Date.now()
    });
  }

  async setOffline(user:any){
    if(!user) return;
    const statusRef = ref(this.db, `/status/${user.uid}`);
    const userRef = doc(this.firestore, `users/${user.uid}`);

    await set(statusRef, { state: 'offline', forcedClose: false, lastChanged: Date.now() });
    await updateDoc(userRef, { active: false, lastActive: serverTimestamp() });
  }

   isUserOnline(status:any){
    if(!status) return false;
    return Date.now() -status.lastChanged < this.ONLINE_TIMEOUT;
   }

async checkForcedClose(user: any): Promise<boolean> {
  if (!user) return false;
  const statusRef = ref(this.db, `/status/${user.uid}`);
  const snapshot = await get(statusRef);
  if(!snapshot.exists()) return false;

  const val = snapshot.val();
  const now = Date.now();
  return val.forcedClose && now - val.lastChanged > 5000;
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
