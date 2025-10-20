import { Injectable } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';
import {ref, onDisconnect, set, serverTimestamp as rtdbTimestamp, serverTimestamp, onValue} from 'firebase/database';
import { Database, get } from '@angular/fire/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PresenceService {
  constructor(private firestore: Firestore , private db: Database){

  }

  async initPresence(user:any){
    if(!user) return;
    const statusRef = ref(this.db, `/status/${user.uid}`);
    

        // verifică dacă user a fost forțat să se deconecteze
    const snapshot = await get(statusRef);
    const forcedClose = snapshot.exists() && snapshot.val().forcedClose === true;
    if (forcedClose) return; // skip initPresence dacă e forcedClose
    
    // setează user online
    await set(statusRef, {
      state: 'online',
      forcedClose: false,
      lastChanged: rtdbTimestamp()
    });

    // când pierde conexiunea, să se seteze offline cu forcedClose true
    onDisconnect(statusRef).set({
      state: 'offline',
      forcedClose: true,
      lastChanged: rtdbTimestamp()
    });

    // Optional: Mirror to Firestore
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


  getUserStatus(uid: string): Observable<any> {
    return new Observable((observer) => {
      const statusRef = ref(this.db, `/status/${uid}`);
      const unsubscribe = onValue(statusRef, (snapshot) => {
        observer.next(snapshot.val());
      }, (error) => {
        observer.error(error);
      });

      // cleanup la unsubscribe
      return () => unsubscribe();
    });
  }
}
