import { inject, Injectable } from '@angular/core';
import { addDoc, arrayUnion, collection, doc, Firestore, updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class ThreadService {
  private firestore: Firestore = inject(Firestore);

  //Funktion noch nicht benutzt
  // Thread erstellen
async createThread(channelId: string, startedBy: string): Promise<string> {
  // 1. Thread anlegen
  const threadsRef = collection(this.firestore, 'threads');
  const docRef = await addDoc(threadsRef, {
    channelId,
    startedBy,
  });

  const threadId = docRef.id;

  // 2. Im Channel threadIds updaten
  const channelRef = doc(this.firestore, 'channels', channelId);
  await updateDoc(channelRef, {
    threadIds: arrayUnion(threadId) // fügt hinzu, ohne vorhandene zu überschreiben
  });

  // 3. Thread-ID zurückgeben
  return threadId;
}}
