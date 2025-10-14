import { Injectable } from '@angular/core';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
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
  addDoc,
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
import { orderBy } from 'firebase/firestore';

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
      'XbsVa8YOj8Nd9vztzX1kAQXrc7Z2',
      '5lntBSrRRUM9JB5AFE14z7lTE6n1',
      'rUnD1S8sHOgwxvN55MtyuD9iwAD2',
      'NxSyGPn1LkPV3bwLSeW94FPKRzm1',
    ];

    for (const devId of devChats) {
      // Chat erstellen (gibt keine chatId zurück)
      await this.chatService.createChat(userId, devId);

      // chatId erneut abrufen
      const chatId = await this.chatService.getChatId(userId, devId);

      // Beispielnachrichten vorbereiten
      let messages: { senderId: string; text: string }[] = [];

      switch (devId) {
        case 'XbsVa8YOj8Nd9vztzX1kAQXrc7Z2':
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
      await updateDoc(this.channelEntwicklerteamDocRef, {
        memberIds: arrayRemove(user.uid),
      });
      await this.resetExampleChannel();
      return deleteDoc(userRef)
        .catch(() => {})
        .then(() => deleteUser(user))
        .catch((err) => console.error('Failed to delete guest user:', err));
    } else {
      return updateDoc(userRef, { active: false }).then(() =>
        signOut(this.auth)
      );
    }
  }

  async resetExampleChannel() {
    const messagesRef = collection(
      this.channelEntwicklerteamDocRef,
      'messages'
    );
    const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(messagesQuery);
    const allMessages = querySnapshot.docs;
    const messagesToDelete = allMessages.slice(6)
    const deletePromises = messagesToDelete.map((msgDoc) =>
      deleteDoc(msgDoc.ref)
    );
    await Promise.all(deletePromises);

    console.log(`Deleted ${deletePromises.length} old messages.`);
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
