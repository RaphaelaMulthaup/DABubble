import { Injectable } from '@angular/core';
import {
  arrayRemove,
  arrayUnion,
  collection,
  collectionData,
  doc,
  DocumentReference,
  DocumentSnapshot,
  Firestore,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, shareReplay, take } from 'rxjs';
import { ReactionInterface } from '../shared/models/reaction.interface';
import { ScreenService } from './screen.service';
import { ScreenSize } from '../shared/types/screen-size.type';
import { ConnectedPosition } from '@angular/cdk/overlay';

@Injectable({
  providedIn: 'root',
})
export class ReactionsService {
  private reactionCache = new Map<string, Observable<ReactionInterface[]>>();
  private screenSize$!: Observable<ScreenSize>;

  constructor(
    private authService: AuthService,
    private firestore: Firestore,
    public screenService: ScreenService
  ) {
    this.screenSize$ = this.screenService.screenSize$;
  }

  /**
   * Toggles a reaction for a given post.
   * If the user has already reacted with the emoji, their ID will be removed.
   * Otherwise, their ID will be added.
   * If the emoji does not exist in the reactions yet, a new reaction document is created.
   *
   * @param parentPath - Path to the parent document (e.g. "chats/{chatId}").
   * @param subcollectionName - Name of the subcollection (e.g. "messages").
   * @param postId - ID of the post being reacted to.
   * @param emoji - the chosen emoji.
   */
  async toggleReaction(
    parentPath: string,
    subcollectionName: string,
    postId: string,
    emoji: { token: string; src: string }
  ) {
    const userId = this.authService.currentUser?.uid ?? null;
    if (!userId) return;
    const { postPath, postRef, reactionRef, reactionSnap } =
    await this.getReactionContext(parentPath, subcollectionName, postId, emoji.token);
    if (reactionSnap.exists()) {
      await this.updateExistingReaction(
        postRef,
        reactionRef,
        reactionSnap,
        userId
      );
    } else { await this.createNewReaction(postRef, reactionRef, emoji, userId); }
  }

  /**
   * Builds and fetches all Firestore references needed for a reaction toggle.
   *
   * @param parentPath - Path to the parent document (e.g. "chats/{chatId}")
   * @param subcollectionName - Name of the subcollection (e.g. "messages")
   * @param postId - ID of the post being reacted to
   * @param emoji - the chosen emoji
   */
  async getReactionContext(
    parentPath: string,
    subcollectionName: string,
    postId: string,
    emojiToken: string
  ) {
    const postPath = `${parentPath}/${subcollectionName}/${postId}`;
    const postRef = doc(this.firestore, postPath);
    const reactionRef = doc(
      this.firestore,
      `${postPath}/reactions/${emojiToken}`
    );
    const reactionSnap = await getDoc(reactionRef);
    return { postPath, postRef, reactionRef, reactionSnap };
  }

  /**
   * Updates an existing reaction by toggling the user's ID.
   *
   * @param postRef - the document of the post reacted to
   * @param reactionRef - the document of reaction
   * @param reactionSnap - a snapshot of the the document of reaction
   * @param userId - the user that reacted
   */
  async updateExistingReaction(
    postRef: DocumentReference,
    reactionRef: DocumentReference,
    reactionSnap: DocumentSnapshot,
    userId: string
  ) {
    const data = reactionSnap.data();
    const users: string[] = data!['users'] || [];
    if (users.includes(userId)) {
      await this.removeUserFromReaction(postRef, reactionRef, userId);
    } else {
      await this.addUserToReaction(postRef, reactionRef, userId);
    }
  }

  /**
   * Removes the current user from the given reaction and updates the post reaction status.
   *
   * @param postRef - the document of the post reacted to
   * @param reactionRef - the document of reaction
   * @param userId - the user that reacted
   */
  async removeUserFromReaction(
    postRef: DocumentReference,
    reactionRef: DocumentReference,
    userId: string
  ) {
    await updateDoc(reactionRef, { users: arrayRemove(userId) });
    const stillHasReactions = await this.checkForPostReactions(postRef.path);
    await updateDoc(postRef, { hasReactions: stillHasReactions });
  }

  /**
   * Adds the current user to the given reaction and marks the post as reacted.
   *
   * @param postRef - the document of the post reacted to
   * @param reactionRef - the document of reaction
   * @param userId - the user that reacted
   */
  async addUserToReaction(
    postRef: DocumentReference,
    reactionRef: DocumentReference,
    userId: string
  ) {
    await updateDoc(reactionRef, { users: arrayUnion(userId) });
    await updateDoc(postRef, { hasReactions: true });
  }

  /**
   * Creates a new reaction-document, when the selected reaction does not exist for this post yet.
   *
   * @param postRef - the document of the post reacted to
   * @param reactionRef - the document of reaction
   * @param emoji - the emoji reacted with
   * @param userId - the user that reacted
   */
  async createNewReaction(
    postRef: DocumentReference,
    reactionRef: DocumentReference,
    emoji: { token: string; src: string },
    userId: string
  ) {
    await setDoc(reactionRef, { emoji, users: [userId] });
    await updateDoc(postRef, { hasReactions: true });
  }

  /**
   * This function checks for each reaction of a post, if its user-array contains any users.
   * If an array contains users, the function returns true.
   * If no reactions-array contains users, the function returns false.
   *
   * @param postPath - the path to the post in firebase.
   */
  async checkForPostReactions(postPath: string): Promise<boolean> {
    const reactionsColRef = collection(this.firestore, `${postPath}/reactions`);
    const reactionsSnap = await getDocs(reactionsColRef);
    return reactionsSnap.docs.some((docSnap) => {
      const users: string[] = docSnap.data()?.['users'] || [];
      return users.length > 0;
    });
  }

  /**
   * Fetches all reactions of a post in real-time as an ReactionInterface-Observable.
   *
   * @param parentPath - Path to the parent document (e.g. "chats/{chatId}").
   * @param subcollectionName - Name of the subcollection (e.g. "messages").
   * @param postId - ID of the post whose reactions should be fetched.
   */
  getReactions(
    parentPath: string,
    subcollectionName: string,
    postId: string
  ): Observable<ReactionInterface[]> {
    const cacheKey = `${parentPath}/${subcollectionName}/${postId}`;
    if (!this.reactionCache.has(cacheKey)) {
      const reactionsRef = collection(
        this.firestore,
        `${parentPath}/${subcollectionName}/${postId}/reactions`
      );
      const reactions$ = collectionData(reactionsRef, { idField: 'id' }).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.reactionCache.set(
        cacheKey,
        reactions$ as Observable<ReactionInterface[]>
      );
    }
    return this.reactionCache.get(cacheKey)!;
  }

  /**
   * This function returns true or false depending on the screenSize and whether senderIsCurrentUser is true or false.
   * It is used to place the right angle of the emoji-picker overlay in the correct corner and to place the emoji-picker overlay on the correct side of the cursor.
   *
   * @param senderIsCurrentUser - whether the posts sender is the current user or not.
   */
  async checkEmojiPickerPosition(
    senderIsCurrentUser: boolean
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.screenSize$.pipe(take(1)).subscribe((size) => {
        if (size !== 'handset') {
          if (senderIsCurrentUser) {
            resolve(true);
          } else {
            resolve(false);
          }
        } else {
          resolve(senderIsCurrentUser);
        }
      });
    });
  }

  /**
   * This function returns the connectedPosition for an emoji-picker-overlay.
   * That position depends on the return value of checkEmojiPickerPosition().
   *
   * @param senderIsCurrentUser whether the posts sender is the current user or not.
   */
  async resolveEmojiPickerPosition(
    senderIsCurrentUser: boolean
  ): Promise<ConnectedPosition> {
    if (await this.checkEmojiPickerPosition(senderIsCurrentUser)) {
      return {
        originX: 'start',
        originY: 'top',
        overlayX: 'end',
        overlayY: 'top',
      };
    } else {
      return {
        originX: 'end',
        originY: 'top',
        overlayX: 'start',
        overlayY: 'top',
      };
    }
  }
}
