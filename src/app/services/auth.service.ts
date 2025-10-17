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
  deleteField,
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
import { ChannelInterface } from '../shared/models/channel.interface';
import {
  CollectionReference,
  DocumentData,
  DocumentReference,
  QueryDocumentSnapshot,
  QuerySnapshot,
  WriteBatch,
  writeBatch,
} from 'firebase/firestore';
import { UserDemoSetupService } from './user-demo-setup.service';

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
    private userDemoSetupService: UserDemoSetupService,
    private screenService: ScreenService,
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
        const guest = credential.user;
        await this.createOrUpdateUserInFirestore(guest, 'anonymous', 'Guest');
        await this.userService.updateUser(guest.uid, {
          photoUrl: './assets/img/no-avatar.svg',
        });
        await this.userDemoSetupService.addDirectChatToTeam(guest.uid);
        //hier die referenz raus
        await updateDoc(this.channelEntwicklerteamDocRef, {
          memberIds: arrayUnion(guest.uid),
        });
      })
      .catch((error) => console.error('Guest login error:', error));
    return from(promise) as Observable<void>;
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
      //die drei raus
    await this.resetExampleChannel(user.uid);
    await this.handleGuestsChannels(user.uid);
    await this.deleteChats(user.uid);
  }
//raus
  async resetExampleChannel(guestUserId: string) {
    await updateDoc(this.channelEntwicklerteamDocRef, {
      memberIds: arrayRemove(guestUserId),
      name: 'Entwicklerteam',
      description:
        'Hier kannst du dich zusammen mit den EntwicklerInnen über die Chat-App austauschen.',
    });
    await this.resetMessagesExampleChannel(guestUserId);
  }
//raus
  async resetMessagesExampleChannel(guestUserId: string) {
    await this.deleteGuestsMessagesInExampleChannel(guestUserId);
    await this.filterMessagesWithReactions(guestUserId);
    const messagesWithAnswersQuery = query(
      this.messagesChannelEntwicklerteamDocRef,
      where('ansCounter', '>', 0)
    );
    const messagesWithAnswersSnapshot = await getDocs(messagesWithAnswersQuery);
    for (const msgDoc of messagesWithAnswersSnapshot.docs) {
      await this.handleMessagesWithAnswers(msgDoc, guestUserId);
    }
  }
//raus
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
//raus
  async filterMessagesWithReactions(guestUserId: string) {
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
//raus
  async handleMessagesWithReactions(
    msgDoc: QueryDocumentSnapshot<DocumentData>,
    guestUserId: string
  ) {
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
//raus
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
//raus
  async deleteGuestReactionIfExists(
    reactionDocRef: DocumentReference<DocumentData>,
    guestUserId: string,
    batch: WriteBatch
  ) {
    const reactionSnap = await getDoc(reactionDocRef);
    if (!reactionSnap.exists()) return;
    const reactionData = reactionSnap.data();
    const users = reactionData['users'] as string[] | undefined;
    if (users && users.includes(guestUserId)) {
      const updatedUsers = users.filter((id) => id !== guestUserId);
      batch.update(reactionDocRef, { users: updatedUsers });
    }
  }
//raus
  async checkWhetherReactionsAreStillAssigned(
    reactionNamesSnap: QuerySnapshot<DocumentData>
  ) {
    for (const reactionDoc of reactionNamesSnap.docs) {
      const reactionData = reactionDoc.data();
      const users = reactionData['users'] as string[] | undefined;
      if (!users || users.length === 0) {
        await deleteDoc(reactionDoc.ref);
      }
    }
  }
//raus
  async setHasReactions(
    reactionsColRef: CollectionReference<DocumentData>,
    msgRef: DocumentReference<DocumentData>
  ) {
    const remainingReactionNamesSnap = await getDocs(reactionsColRef);
    if (remainingReactionNamesSnap.empty) {
      await updateDoc(msgRef, { hasReactions: false });
    }
  }
//raus
  async handleMessagesWithAnswers(
    msgDoc: QueryDocumentSnapshot<DocumentData>,
    guestUserId: string
  ) {
    const msgRef = msgDoc.ref; //eine message mit answers
    const answersColRef = collection(msgRef, 'answers');
    const answersIdsSnap = await getDocs(answersColRef); //alle answers einer message
    await this.deleteAnswerfromGuestUserId(answersIdsSnap, guestUserId);
    await this.setAnsCounter(answersColRef, msgRef);
  }
//raus
  async deleteAnswerfromGuestUserId(
    answersIdsSnap: QuerySnapshot<DocumentData>, //alle answers einer message
    guestUserId: string
  ) {
    const localBatch = writeBatch(this.firestore);
    for (const answerDoc of answersIdsSnap.docs) {
      //eine answer
      await this.deleteGuestsAnswerIfExists(
        answerDoc.ref,
        guestUserId,
        localBatch
      );
    }
    await localBatch.commit();
  }
//raus
  async deleteGuestsAnswerIfExists(
    answerDocRef: DocumentReference<DocumentData>,
    guestUserId: string,
    localBatch: WriteBatch
  ) {
    const answerSnap = await getDoc(answerDocRef);
    if (!answerSnap.exists()) return;
    const answerData = answerSnap.data();
    const users = answerData['senderId'];
    if (users === guestUserId) {
      localBatch.delete(answerDocRef);
    }
  }
//raus
  async setAnsCounter(
    answersColRef: CollectionReference<DocumentData>,
    msgRef: DocumentReference<DocumentData>
  ) {
    const remainingAnswerSnap = await getDocs(answersColRef);
    if (remainingAnswerSnap.empty) {
      await updateDoc(msgRef, {
        ansCounter: deleteField(),
        ansLastCreatedAt: deleteField(),
      });
    } else {
      await this.handleRemainingAnswers(remainingAnswerSnap, msgRef);
    }
  }
//raus
  async handleRemainingAnswers(
    remainingAnswerSnap: QuerySnapshot<DocumentData>,
    msgRef: DocumentReference<DocumentData>
  ) {
    const createdAts = remainingAnswerSnap.docs.map(
      (doc) => doc.data()['createdAt']
    );
    const newestCreatedAt = createdAts.reduce((latest, current) => {
      return current.toMillis() > latest.toMillis() ? current : latest;
    });
    await updateDoc(msgRef, {
      ansCounter: remainingAnswerSnap.size,
      ansLastCreatedAt: newestCreatedAt,
    });
  }
//raus
  async handleGuestsChannels(guestUserId: string) {
    const q = this.buildUserChannelsQuery(guestUserId);
    const snapshot = await getDocs(q);
    const batch = writeBatch(this.firestore);
    for (const docSnap of snapshot.docs) {
      this.handleChannelBatchUpdate(batch, docSnap, guestUserId);
    }
    await batch.commit();
  }
//raus
  handleChannelBatchUpdate(
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
//raus
  buildUserChannelsQuery(userId: string) {
    return query(
      collection(this.firestore, 'channels'),
      where('memberIds', 'array-contains', userId)
    );
  }
//raus
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
