import { Injectable } from '@angular/core';
import {
  arrayRemove,
  collection,
  CollectionReference,
  deleteField,
  doc,
  DocumentData,
  DocumentReference,
  Firestore,
  getDoc,
  getDocs,
  query,
  QueryDocumentSnapshot,
  QuerySnapshot,
  updateDoc,
  where,
  writeBatch,
  WriteBatch,
} from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root',
})
export class ResetDemoChannelService {
  channelEntwicklerteamGuestsDocRef: DocumentReference<DocumentData>;
  messagesChannelEntwicklerteamGuestDocRef: CollectionReference<DocumentData>;

  constructor(private firestore: Firestore) {
    this.channelEntwicklerteamGuestsDocRef = doc(
      this.firestore,
      `channels/2TrvdqcsYSbj2ZpWLfvT`
    );
    this.messagesChannelEntwicklerteamGuestDocRef = collection(
      this.channelEntwicklerteamGuestsDocRef,
      'messages'
    );
  }

  async resetExampleChannel(guestUserId: string) {
    await updateDoc(this.channelEntwicklerteamGuestsDocRef, {
      memberIds: arrayRemove(guestUserId),
      name: 'Entwicklerteam',
      description:
        'Hier kannst du dich zusammen mit den EntwicklerInnen über die Chat-App austauschen.',
    });
    await this.resetMessagesExampleChannel(guestUserId);
  }

  async resetMessagesExampleChannel(guestUserId: string) {
    await this.deleteGuestsMessagesInExampleChannel(guestUserId);
    await this.filterMessagesWithReactions(guestUserId);
    const messagesWithAnswersQuery = query(
      this.messagesChannelEntwicklerteamGuestDocRef,
      where('ansCounter', '>', 0)
    );
    const messagesWithAnswersSnapshot = await getDocs(messagesWithAnswersQuery);
    for (const msgDoc of messagesWithAnswersSnapshot.docs) {
      await this.handleMessagesWithAnswers(msgDoc, guestUserId);
    }
  }

  async deleteGuestsMessagesInExampleChannel(guestUserId: string) {
    const messagesQuery = query(
      this.messagesChannelEntwicklerteamGuestDocRef,
      where('senderId', '==', guestUserId)
    );
    const messagesSnapshot = await getDocs(messagesQuery);
    let batch = writeBatch(this.firestore);
    for (const msgDoc of messagesSnapshot.docs) {
      await this.deleteAnswersReactionsAndMessage(batch, msgDoc);
    }
    await batch.commit();
  }

  async deleteAnswersReactionsAndMessage(
    batch: WriteBatch,
    msgDoc: QueryDocumentSnapshot<DocumentData>
  ) {
    const answersCol = collection(msgDoc.ref, 'answers');
    const reactionsCol = collection(msgDoc.ref, 'reactions');
    const [answersSnap, reactionsSnap] = await Promise.all([
      getDocs(answersCol),
      getDocs(reactionsCol),
    ]);
    for (const a of answersSnap.docs) batch.delete(a.ref);
    for (const r of reactionsSnap.docs) batch.delete(r.ref);
    batch.delete(msgDoc.ref);
  }

  async filterMessagesWithReactions(guestUserId: string) {
    const messagesWithReactionsQuery = query(
      this.messagesChannelEntwicklerteamGuestDocRef,
      where('hasReactions', '==', true)
    );
    const messagesWithReactionsSnapshot = await getDocs(
      messagesWithReactionsQuery
    );
    for (const msgDoc of messagesWithReactionsSnapshot.docs) {
      await this.handleMessagesWithReactions(msgDoc, guestUserId);
    }
  }

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
    const reactionSnap = await getDoc(reactionDocRef);
    if (!reactionSnap.exists()) return;
    const users = reactionSnap.data()['users'] as string[] | undefined;
    if (!users || !users.includes(guestUserId)) return;
    const updatedUsers = this.removeGuestFromUsersArray(users, guestUserId);
    this.applyReactionChange(reactionDocRef, updatedUsers, batch);
  }

  removeGuestFromUsersArray(users: string[], guestUserId: string) {
    return users.filter((id) => id !== guestUserId);
  }

  applyReactionChange(
    reactionDocRef: DocumentReference<DocumentData>,
    updatedUsers: string[],
    batch: WriteBatch
  ) {
    if (updatedUsers.length === 0) {
      batch.delete(reactionDocRef);
      return;
    }
    batch.update(reactionDocRef, { users: updatedUsers });
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

  async handleMessagesWithAnswers(
    msgDoc: QueryDocumentSnapshot<DocumentData>,
    guestUserId: string
  ) {
    const msgRef = msgDoc.ref;
    const answersColRef = collection(msgRef, 'answers');
    const answersIdsSnap = await getDocs(answersColRef);
    await this.deleteAnswerfromGuestUserId(answersIdsSnap, guestUserId);
    await this.setAnsCounter(answersColRef, msgRef);
  }

  async deleteAnswerfromGuestUserId(
    answersIdsSnap: QuerySnapshot<DocumentData>,
    guestUserId: string
  ) {
    const localBatch = writeBatch(this.firestore);
    for (const answerDoc of answersIdsSnap.docs) {
      await this.deleteGuestsAnswerIfExists(
        answerDoc.ref,
        guestUserId,
        localBatch
      );
    }
    await localBatch.commit();
  }

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
}
