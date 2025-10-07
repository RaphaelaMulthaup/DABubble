import { Injectable } from '@angular/core';
import {
  arrayRemove,
  arrayUnion,
  collection,
  collectionData,
  doc,
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
  screenSize$!: Observable<ScreenSize>;

  constructor(
    private authService: AuthService,
    private firestore: Firestore,
    public screenService: ScreenService
  ) {
    this.screenSize$ = this.screenService.screenSize$;
  }

  /**
   * Toggles a reaction for a given post.
   *
   * - If the user has already reacted with the emoji, their ID will be removed.
   * - Otherwise, their ID will be added.
   * - If the emoji does not exist yet, a new reaction document is created.
   *
   * @param parentPath - Path to the parent document (e.g. "chats/{chatId}").
   * @param subcollectionName - Name of the subcollection (e.g. "messages").
   * @param postId - ID of the post being reacted to.
   * @param emojiToken - The token of the chosen emoji.
   * @returns A Promise that resolves once the reaction update has been applied.
   */
  async toggleReaction(
    parentPath: string,
    subcollectionName: string,
    postId: string,
    emoji: { token: string; src: string }
  ) {
    let userId = this.authService.currentUser?.uid ?? null;
    const postPath = `${parentPath}/${subcollectionName}/${postId}`;
    const postRef = doc(this.firestore, postPath);
    const reactionRef = doc(
      this.firestore,
      `${postPath}/reactions/${emoji.token}`
    );
    const reactionSnap = await getDoc(reactionRef);
    if (reactionSnap.exists()) {
      const data = reactionSnap.data();
      const users: string[] = data['users'] || [];

      if (userId && users.includes(userId)) {
        // User already reacted → remove their reaction
        await updateDoc(reactionRef, {
          users: arrayRemove(userId),
        });
        const postHasReactions = await this.checkForPostReactions(postPath);
        await updateDoc(postRef, { hasReactions: postHasReactions });
      } else {
        // User has not reacted → add their reaction
        await updateDoc(reactionRef, {
          users: arrayUnion(userId),
        });
        await updateDoc(postRef, { hasReactions: true });
      }
    } else {
      // First reaction with this emoji → create a new reaction document
      await setDoc(reactionRef, {
        emoji,
        users: [userId],
      });
      await updateDoc(postRef, { hasReactions: true });
    }
  }

  /**
   * This function checks for each reaction of a post, if its user-array contains any users.
   * If an array contains users, the function returns true.
   * If no reactions-array contains users, the function returns false.
   *
   * @param postPath - the path to the post in firebase.
   */
  private async checkForPostReactions(postPath: string): Promise<boolean> {
    const reactionsColRef = collection(this.firestore, `${postPath}/reactions`);
    const reactionsSnap = await getDocs(reactionsColRef);

    return reactionsSnap.docs.some((docSnap) => {
      const users: string[] = docSnap.data()?.['users'] || [];
      return users.length > 0;
    });
  }

  /**
   * Fetches all reactions of a post in real-time.
   *
   * @param parentPath - Path to the parent document (e.g. "chats/{chatId}").
   * @param subcollectionName - Name of the subcollection (e.g. "messages").
   * @param postId - ID of the post whose reactions should be fetched.
   * @returns Observable that emits the list of reactions (with emoji name and user IDs).
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
   * @param senderIsCurrentUser whether the posts sender is the current user or not.
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
  async resolveEmojiPickerPosition(senderIsCurrentUser: boolean): Promise<ConnectedPosition> {
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
