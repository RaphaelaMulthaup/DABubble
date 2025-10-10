import { Injectable } from '@angular/core';
import {
  Auth,
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
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { from, map, Observable, of, shareReplay, switchMap, tap } from 'rxjs';
import { UserInterface } from '../shared/models/user.interface';
import { UserService } from './user.service';
import { ChatService } from './chat.service';
import { ScreenService } from './screen.service';
import { UserToRegisterInterface } from '../shared/models/user.to.register.interface';
import { PostService } from './post.service';
import { ChannelInterface } from '../shared/models/channel.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private provider = new GoogleAuthProvider();

  /** Reaktives Observable für den aktuellen Firestore-User */
  public currentUser$: Observable<UserInterface | null>;

  /** Optional synchroner Zugriff */
  private currentUserSnapshot: UserInterface | null = null;

  constructor(
    private auth: Auth,
    private chatService: ChatService,
    private firestore: Firestore,
    private userService: UserService,
    private screenService: ScreenService,
    private postService: PostService
  ) {
    // 🔥 Reaktives Observable mit Absicherung, dass User-Dokument existiert
    this.currentUser$ = new Observable<User | null>((subscriber) =>
      onAuthStateChanged(this.auth, subscriber.next.bind(subscriber))
    ).pipe(
      switchMap((firebaseUser) => {
        if (!firebaseUser) return of(null);

        return from(this.ensureUserDocExists(firebaseUser)).pipe(
          // Sobald das Doc existiert, reaktiv auf Änderungen hören
          switchMap(() => this.userService.getUserById(firebaseUser.uid))
        );
      }),
      tap((user) => (this.currentUserSnapshot = user)),
      shareReplay({ bufferSize: 1, refCount: true })
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
    let snap = await getDoc(userRef);

    if (!snap.exists()) {
      await this.createOrUpdateUserInFirestore(
        user,
        (user.providerData[0]?.providerId as any) ?? 'password'
      );

      // Optional: kleine Verzögerung, um Firestore-Propagation abzuwarten
      await new Promise((res) => setTimeout(res, 150));
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
      switchMap(async (response) => {
        const user = response.user;
        await this.createOrUpdateUserInFirestore(
          user,
          'password',
          userData.displayName,
          userData.photoURL || undefined
        );
      }),
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
        await this.createDeveloperTeamChannel(user.uid);
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

  async createDeveloperTeamChannel(guestId: string) {    
    const devIds = [
      'XbsVa8YOj8Nd9vztzX1kAQXrc7Z2',
      '5lntBSrRRUM9JB5AFE14z7lTE6n1',
      'rUnD1S8sHOgwxvN55MtyuD9iwAD2',
      'NxSyGPn1LkPV3bwLSeW94FPKRzm1',
    ];
    const channelRef = collection(this.firestore, 'channels');

    // Channel existiert noch nicht, also erstellen
    const channelData: ChannelInterface = {
      name: 'Entwicklerteam',
      description:
        'Hier kannst du dich zusammen mit den EntwicklerInnen über die Chat-App austauschen.',
      memberIds: [...devIds, guestId],
      createdBy: guestId,
      createdAt: new Date(),
    };

    // Channel anlegen
    const channelDocRef = await addDoc(channelRef, channelData);

    // Die gesamte Unterhaltung als Nachrichten im Channel einfügen
    const messages = [
      {
        senderId: 'XbsVa8YOj8Nd9vztzX1kAQXrc7Z2',
        text: 'Wie wäre es, wenn wir beim eigenen User-List-Item noch ein "(Du)" hinzufügen, um den aktuellen Nutzer zu kennzeichnen?',
      },
      {
        senderId: guestId, // Beispiel-Entwickler-ID
        text: 'Das fände ich super! So sieht man direkt, dass es der eigene Account ist. Besonders für neue Nutzer ist das eine tolle Orientierung.',
      },
      {
        senderId: '5lntBSrRRUM9JB5AFE14z7lTE6n1', // Beispiel-Entwickler-ID
        text: 'Wir könnten eine kleine Abfrage einbauen, um zu prüfen, ob der User, der angezeigt wird, der aktuelle Nutzer ist. In dem Fall fügen wir das "(Du)" hinzu.',
      },
      {
        senderId: 'rUnD1S8sHOgwxvN55MtyuD9iwAD2', // Beispiel-Entwickler-ID
        text: 'Ich kann das umsetzen! Wir schauen dann, ob der User in `currentUser$` dem angezeigten User entspricht. Wenn ja, fügen wir das "(Du)" hinzu.',
      },
      {
        senderId: 'NxSyGPn1LkPV3bwLSeW94FPKRzm1', // Der vierte Entwickler
        text: 'Ich würde noch vorschlagen, dass wir darauf achten, dass das "Du" auch bei einem gekürzten Namen in einem kleineren Layout sichtbar bleibt. Der Name kann sich den Platz nehmen, bis er mit "..." gekürzt wird, aber das "(Du)" sollte immer daneben erscheinen.',
      },
      {
        senderId: guestId,
        text: 'Super Idee! Dann ist es auch bei kleinen Bildschirmen klar, wer der eigene Account ist. Danke für den Vorschlag!',
      },
    ];

    // Nachrichten im Channel erstellen
    for (const msg of messages) {
      await this.postService.createMessage(
        channelDocRef.id,
        msg.senderId,
        msg.text,
        'channel'
      );
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
  logout() {
    const user = this.auth.currentUser;
    if (!user) return signOut(this.auth);

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const isGuest = user.isAnonymous;

    if (isGuest) {
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
