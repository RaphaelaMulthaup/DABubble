import { Injectable } from '@angular/core';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from '@angular/fire/auth';
import {
  signInWithEmailAndPassword,
  signInAnonymously,
  deleteUser,
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  Firestore,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  docData,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import {
  catchError,
  distinctUntilChanged,
  concatMap,
  from,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { UserInterface } from '../shared/models/user.interface';
import { UserService } from './user.service';
import { ChatService } from './chat.service';
import { ScreenService } from './screen.service';
import { UserToRegisterInterface } from '../shared/models/user.to.register.interface';
import { PostService } from './post.service';
import { ChannelInterface } from '../shared/models/channel.interface';
import {
  CollectionReference,
  DocumentData,
  DocumentReference,
  orderBy,
  QueryDocumentSnapshot,
  QuerySnapshot,
  WriteBatch,
  writeBatch,
} from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private provider = new GoogleAuthProvider();

  /** Reaktives Observable für den aktuellen Firestore-User */
  public currentUser$: Observable<UserInterface | null>;

  /** Optional synchroner Zugriff */
  private currentUserSnapshot: UserInterface | null = null;
  channelEntwicklerteamDocRef;
  messagesChannelEntwicklerteamDocRef;

  constructor(
    private auth: Auth,
    private chatService: ChatService,
    private firestore: Firestore,
    private userService: UserService,
    private screenService: ScreenService,
    private postService: PostService
  ) {
    // 🔥 Reaktives Observable mit Absicherung, dass User-Dokument existiert
    this.currentUser$ = authState(this.auth).pipe(
      switchMap((firebaseUser) => {
        if (!firebaseUser) return of(null);

        const userRef = doc(this.firestore, `users/${firebaseUser.uid}`);

        return from(this.ensureUserDocExists(firebaseUser)).pipe(
          // falls ensureUserDocExists fehlschlägt, fangen wir den Fehler ab
          // und geben null zurück, anstatt den Stream sterben zu lassen
          catchError((err) => {
            console.error('ensureUserDocExists failed', err);
            return of(void 0);
          }),
          switchMap(() => docData(userRef) as Observable<UserInterface | null>),
          // wenn docData mal undefined liefert, setzen wir explizit null
          map((data) => data ?? null)
        );
      }),
      tap((user) => (this.currentUserSnapshot = user)),
      // optional: nur dann neu emitten wenn sich die uid ändert
      distinctUntilChanged((a, b) => a?.uid === b?.uid),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.channelEntwicklerteamDocRef = doc(
      this.firestore,
      `channels/2TrvdqcsYSbj2ZpWLfvT`
    );
    this.messagesChannelEntwicklerteamDocRef = collection(
      this.channelEntwicklerteamDocRef,
      'messages'
    );
    window.addEventListener('beforeunload', () => {
      const user = this.auth.currentUser;
      if (user?.isAnonymous) {
        try {
          const userRef = doc(this.firestore, `users/${user.uid}`);
          this.logoutGuest(user, userRef);
        } catch (err) {
          console.warn('Guest logout on unload failed:', err);
        }
      }
    });
  }

  /** Synchronously get current Firestore User */
  get currentUser(): UserInterface | null {
    return this.currentUserSnapshot;
  }

  /** Get current Firebase Auth user ID or null */
  getCurrentUserId(): string | null {
    return this.currentUserSnapshot?.uid ?? null;
  }

  /** Ensure Firestore document for user exists */
  private async ensureUserDocExists(user: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await this.createOrUpdateUserInFirestore(
        user,
        (user.providerData[0]?.providerId as any) ?? 'password'
      );
    }
  }

  /** Create or update Firestore user document */
  private async createOrUpdateUserInFirestore(
    user: User,
    authProvider: 'google.com' | 'password' | 'anonymous',
    displayName?: string,
    photoURL?: string
  ) {
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const userData: UserInterface = {
        uid: user.uid,
        name: displayName ?? user.displayName ?? '',
        email: user.email ?? '',
        photoUrl: photoURL ?? user.photoURL ?? '',
        authProvider,
        contacts: {},
        active: true,
        role: 'user',
      };
      await setDoc(userRef, userData);
    } else {
      await updateDoc(userRef, { active: true });
    }
  }

  /** Register new user */
  register(userData: UserToRegisterInterface): Observable<void> {
    return from(
      createUserWithEmailAndPassword(
        this.auth,
        userData.email,
        userData.password
      )
    ).pipe(
      concatMap((response) =>
        from(
          this.createOrUpdateUserInFirestore(
            response.user,
            'password',
            userData.displayName,
            userData.photoURL || undefined
          )
        )
      ),
      map(() => void 0)
    );
  }

  /** Login with email/password */
  login(email: string, password: string): Observable<void> {
    const promise = signInWithEmailAndPassword(this.auth, email, password).then(
      async (response) => {
        await this.screenService.setInitDashboardState();
        await this.createOrUpdateUserInFirestore(response.user, 'password');
      }
    );
    return from(promise);
  }

  /** Login as guest */
  loginAsGuest(): Observable<void> {
    const promise = signInAnonymously(this.auth)
      .then(async (credential) => {
        await this.screenService.setInitDashboardState();
        const user = credential.user;
        await this.createOrUpdateUserInFirestore(user, 'anonymous', 'Guest');
        await this.userService.updateUser(user.uid, {
          photoUrl: './assets/img/no-avatar.svg',
        });
        await this.addDirectChatToTeam(user.uid);

        await updateDoc(this.channelEntwicklerteamDocRef, {
          memberIds: arrayUnion(user.uid),
        });
      })
      .catch((error) => console.error('Guest login error:', error));
    return from(promise) as Observable<void>;
  }

  async addDirectChatToTeam(userId: string) {
    const devChats = [
      'YMOQBS4sWIQoVbLI2OUphJ7Ruug2',
      '5lntBSrRRUM9JB5AFE14z7lTE6n1',
      'rUnD1S8sHOgwxvN55MtyuD9iwAD2',
      'NxSyGPn1LkPV3bwLSeW94FPKRzm1',
    ];

    for (const devId of devChats) {
      // Chat erstellen (gibt keine chatId zurück)
      await this.chatService.createChat(userId, devId);

      // chatId erneut abrufen
      const chatId = await this.chatService.getChatId(userId, devId);
      // this.chatsWithGuestsIds.push(chatId);

      // Beispielnachrichten vorbereiten
      let messages: { senderId: string; text: string }[] = [];

      switch (devId) {
        case 'YMOQBS4sWIQoVbLI2OUphJ7Ruug2':
          messages = [
            {
              senderId: devId,
              text: 'Hey! Schön, dass du unseren Chat ausprobierst 😊',
            },
            { senderId: userId, text: 'Hi! Sieht alles sehr gut aus!' },
            {
              senderId: devId,
              text: 'Freut mich! Probier ruhig ein paar Funktionen aus.',
            },
          ];
          break;

        case '5lntBSrRRUM9JB5AFE14z7lTE6n1':
          messages = [
            {
              senderId: devId,
              text: 'Hallo! Schön, dass du dir unsere App anschaust.',
            },
            {
              senderId: userId,
              text: 'Hi! Ja, ich gucke mich gerade ein bisschen um. Was war dein Beitrag zur Chat-App?',
            },
            {
              senderId: devId,
              text: 'Ich habe zum Beispiel die Suchfunktion umgesetzt. Such doch mal nach dem Channel #Entwicklerteam. Du kannst ihn natürlich auch direkt in der Sidenav anklicken.',
            },
          ];
          break;

        case 'rUnD1S8sHOgwxvN55MtyuD9iwAD2':
          messages = [
            { senderId: devId, text: 'Hi! Willkommen im Demo-Chat 🎨' },
            { senderId: userId, text: 'Danke! Alles wirkt sehr aufgeräumt.' },
            {
              senderId: devId,
              text: 'Freut mich! Schau dich ruhig noch weiter um.',
            },
          ];
          break;

        case 'NxSyGPn1LkPV3bwLSeW94FPKRzm1':
          messages = [
            { senderId: devId, text: 'Hey! Schön, dass du hier bist 🧠' },
            { senderId: userId, text: 'Hi! Die App reagiert richtig flüssig.' },
            {
              senderId: devId,
              text: 'Super! Dann viel Spaß beim Ausprobieren 🚀',
            },
          ];
          break;
      }

      // Nachrichten erstellen
      for (const msg of messages) {
        await this.postService.createMessage(
          chatId,
          msg.senderId,
          msg.text,
          'chat'
        );
      }
    }
  }

  /** Login with Google */
  loginWithGoogle(): Observable<void> {
    const auth = getAuth();
    const promise = signInWithPopup(auth, this.provider)
      .then(async (response) => {
        await this.screenService.setInitDashboardState();
        const user = response.user;
        await this.createOrUpdateUserInFirestore(user, 'google.com');
      })
      .catch((error) => console.error('Google Login Error:', error));
    return from(promise) as Observable<void>;
  }

  /** Logout and update Firestore */
  async logout() {
    const user = this.auth.currentUser;
    if (!user) return signOut(this.auth);

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const isGuest = user.isAnonymous;

    if (isGuest) {
      await this.logoutGuest(user, userRef);
    } else {
      await updateDoc(userRef, { active: false });
      await signOut(this.auth);
    }
  }

  async logoutGuest(user: User, userRef: DocumentReference) {
    await deleteDoc(userRef)
      .catch(() => {})
      .then(() => deleteUser(user))
      .catch((err) => console.error('Failed to delete guest user:', err));
    await this.resetExampleChannel(user.uid);
    await this.handleGuestsChannels(user.uid);
    await this.deleteChats(user.uid);
  }

  async resetExampleChannel(guestUserId: string) {
    await updateDoc(this.channelEntwicklerteamDocRef, {
      memberIds: arrayRemove(guestUserId),
      name: 'Entwicklerteam',
      description:
        'Hier kannst du dich zusammen mit den EntwicklerInnen über die Chat-App austauschen.',
    });
    await this.resetMessagesExampleChannel(guestUserId);
  }

  async resetMessagesExampleChannel(guestUserId: string) {
    await this.deleteGuestsMessagesInExampleChannel(guestUserId);
    const messagesWithReactionsQuery = query(
      this.messagesChannelEntwicklerteamDocRef,
      where('hasReactions', '==', true)
    );
    const messagesWithReactionsSnapshot = await getDocs(
      messagesWithReactionsQuery
    );
    for (const msgDoc of messagesWithReactionsSnapshot.docs) {
      await this.handleMessagesWithReactions(msgDoc, guestUserId);
    }
  }

  async deleteGuestsMessagesInExampleChannel(guestUserId: string) {
    const messagesQuery = query(
      this.messagesChannelEntwicklerteamDocRef,
      where('senderId', '==', guestUserId)
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    let batch = writeBatch(this.firestore);

    for (const msgDoc of messagesSnapshot.docs) {
      batch.delete(msgDoc.ref);
    }
    await batch.commit();
  }

  async handleMessagesWithReactions(msgDoc: QueryDocumentSnapshot<DocumentData>, guestUserId: string) {
    const msgRef = msgDoc.ref;
    const reactionsColRef = collection(msgRef, 'reactions');
    const reactionNamesSnap = await getDocs(reactionsColRef);
    await this.deleteGuestUserIdAsSenderOfReactions(
      reactionNamesSnap,
      guestUserId
    );
    await this.checkWhetherReactionsAreStillAssigned(reactionNamesSnap);
    await this.setHasReactions(reactionsColRef, msgRef);
  }

  async deleteGuestUserIdAsSenderOfReactions(
    reactionNamesSnap: QuerySnapshot<DocumentData>,
    guestUserId: string
  ) {
    const localBatch = writeBatch(this.firestore);
    for (const reactionDoc of reactionNamesSnap.docs) {
      await this.deleteGuestReactionIfExists(
        reactionDoc.ref,
        guestUserId,
        localBatch
      );
    }
    await localBatch.commit();
  }

  async deleteGuestReactionIfExists(
    reactionDocRef: DocumentReference<DocumentData>,
    guestUserId: string,
    batch: WriteBatch
  ) {
    const userDocRef = doc(reactionDocRef, 'user', guestUserId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      batch.delete(userDocRef);
    }
  }

  async checkWhetherReactionsAreStillAssigned(
    reactionNamesSnap: QuerySnapshot<DocumentData>
  ) {
    for (const reactionDoc of reactionNamesSnap.docs) {
      const usersColRef = collection(reactionDoc.ref, 'user');
      const usersSnap = await getDocs(query(usersColRef, limit(1)));
      if (usersSnap.empty) {
        await deleteDoc(reactionDoc.ref);
      }
    }
  }

  async setHasReactions(
    reactionsColRef: CollectionReference<DocumentData>,
    msgRef: DocumentReference<DocumentData>
  ) {
    const remainingReactionNamesSnap = await getDocs(reactionsColRef);
    if (remainingReactionNamesSnap.empty) {
      await updateDoc(msgRef, { hasReactions: false });
    }
  }

  async handleGuestsChannels(guestUserId: string) {
    const q = this.buildUserChannelsQuery(guestUserId);
    const snapshot = await getDocs(q);
    const batch = writeBatch(this.firestore);
    for (const docSnap of snapshot.docs) {
      this.handleChannelBatchUpdate(batch, docSnap, guestUserId);
    }
    await batch.commit();
  }

  private handleChannelBatchUpdate(
    batch: WriteBatch,
    docSnap: QueryDocumentSnapshot,
    guestUserId: string
  ) {
    const channel = docSnap.data() as ChannelInterface;
    const channelRef = doc(this.firestore, 'channels', docSnap.id);
    if (channel.createdBy === guestUserId) {
      batch.delete(channelRef);
    } else {
      batch.update(channelRef, { memberIds: arrayRemove(guestUserId) });
    }
  }

  buildUserChannelsQuery(userId: string) {
    return query(
      collection(this.firestore, 'channels'),
      where('memberIds', 'array-contains', userId)
    );
  }

  async deleteChats(userId: string) {
    const userChats = await this.chatService.getChatRefsForUser(userId);
    for (const chat of userChats) {
      const messagesRef = collection(chat.ref, 'messages');
      const messagesSnap = await getDocs(messagesRef);

      const batch = writeBatch(this.firestore);

      // Alle Nachrichten im Batch löschen
      messagesSnap.docs.forEach((msg) => batch.delete(msg.ref));

      // Chat-Dokument selbst löschen
      batch.delete(chat.ref);

      // Batch ausführen
      await batch.commit();
    }
  }

  /** Send password reset email */
  sendPasswordResetEmail(email: string): Promise<void> {
    const auth = getAuth();
    return sendPasswordResetEmail(auth, email);
  }

  /** Update user profile picture */
  updateUserPhotoUrl(photoUrl: string): Promise<void> {
    const user = this.auth.currentUser;
    const userRef = doc(this.firestore, `users/${user?.uid}`);
    return updateDoc(userRef, { photoUrl });
  }

  /** Update user name */
  updateUserName(newName: string): Promise<void> {
    const user = this.auth.currentUser;
    const userRef = doc(this.firestore, `users/${user?.uid}`);
    return updateDoc(userRef, { name: newName });
  }
}
