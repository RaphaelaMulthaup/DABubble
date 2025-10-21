import { Injectable } from '@angular/core';
import { doc, Firestore,updateDoc } from '@angular/fire/firestore';
import {ref, onDisconnect, set, serverTimestamp as rtdbTimestamp, serverTimestamp} from 'firebase/database';
import { Database, get } from '@angular/fire/database';

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
  constructor(private firestore: Firestore , private db: Database){

  }

  async initPresence(user:any){
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

    const userRef = doc(this.firestore, `users/${user.uid}`);
    updateDoc(userRef, {
      active: true,
      lastActive: serverTimestamp()
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
    lastChanged: serverTimestamp()
  });
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

}
