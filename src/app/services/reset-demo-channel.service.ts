import { Injectable } from '@angular/core';
import { arrayRemove, collection, CollectionReference, deleteField, doc, DocumentData, DocumentReference, Firestore, getDoc, getDocs, query, QueryDocumentSnapshot, QuerySnapshot, updateDoc, where, writeBatch, WriteBatch } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class ResetDemoChannelService {
  channelEntwicklerteamGuestsDocRef: DocumentReference<DocumentData>;
  messagesChannelEntwicklerteamGuestDocRef: CollectionReference<DocumentData>;

  constructor(private firestore: Firestore) {
    this.channelEntwicklerteamGuestsDocRef = doc(this.firestore,`channels/2TrvdqcsYSbj2ZpWLfvT`);
    this.messagesChannelEntwicklerteamGuestDocRef = collection(this.channelEntwicklerteamGuestsDocRef, 'messages');
  }

  /**
   * Resets the example channel to its initial state by removing a guest user, restoring default metadata, and resetting related messages.
   *
   * @param guestUserId - The UID of the guest user
   */
  async resetExampleChannel(guestUserId: string) {
    await updateDoc(this.channelEntwicklerteamGuestsDocRef, {
      memberIds: arrayRemove(guestUserId),
      name: 'Entwicklerteam',
      description: 'Hier kannst du dich zusammen mit den EntwicklerInnen über die Chat-App austauschen.',
    });
    await this.resetMessagesExampleChannel(guestUserId);
  }

  /**
   * Resets all messages in the example channel related to the guest user.
   * Deletes their messages, removes reactions, and adjusts answer counters.
   *
   * @param guestUserId - The UID of the guest user
   */
  async resetMessagesExampleChannel(guestUserId: string) {
    await this.deleteGuestsMessagesInExampleChannel(guestUserId);
    await this.filterMessagesWithReactions(guestUserId);
    const messagesWithAnswersQuery = query(this.messagesChannelEntwicklerteamGuestDocRef, where('ansCounter', '>', 0));
    const messagesWithAnswersSnapshot = await getDocs(messagesWithAnswersQuery);
    for (const msgDoc of messagesWithAnswersSnapshot.docs) await this.handleMessagesWithAnswers(msgDoc, guestUserId);
  }

  /**
   * Deletes all messages sent by a guest user in the example channel, including their answers and reactions.
   *
   * @param guestUserId - The UID of the guest user
   */
  async deleteGuestsMessagesInExampleChannel(guestUserId: string) {
    const messagesQuery = query(this.messagesChannelEntwicklerteamGuestDocRef, where('senderId', '==', guestUserId));
    const messagesSnapshot = await getDocs(messagesQuery);
    let batch = writeBatch(this.firestore);
    for (const msgDoc of messagesSnapshot.docs) await this.deleteAnswersReactionsAndMessage(batch, msgDoc);
    await batch.commit();
  }

  /**
   * Deletes all answers and reactions of a given message document and then removes the message itself.
   *
   * @param batch - The Firestore batch instance
   * @param msgDoc - The message document snapshot to delete
   */
  async deleteAnswersReactionsAndMessage(batch: WriteBatch, msgDoc: QueryDocumentSnapshot<DocumentData>) {
    const answersCol = collection(msgDoc.ref, 'answers');
    const reactionsCol = collection(msgDoc.ref, 'reactions');
    const [answersSnap, reactionsSnap] = await Promise.all([getDocs(answersCol), getDocs(reactionsCol)]);
    for (const a of answersSnap.docs) batch.delete(a.ref);
    for (const r of reactionsSnap.docs) batch.delete(r.ref);
    batch.delete(msgDoc.ref);
  }

  /**
   * Finds and handles all messages in the example channel that contain reactions from a guest user.
   *
   * @param guestUserId - The UID of the guest user
   */
  async filterMessagesWithReactions(guestUserId: string) {
    const messagesWithReactionsQuery = query(this.messagesChannelEntwicklerteamGuestDocRef, where('hasReactions', '==', true));
    const messagesWithReactionsSnapshot = await getDocs(messagesWithReactionsQuery);
    for (const msgDoc of messagesWithReactionsSnapshot.docs) await this.handleMessagesWithReactions(msgDoc, guestUserId);
  }

  /**
   * Removes guest user reactions from a message and updates the message’s reaction status.
   *
   * @param msgDoc - The message document snapshot
   * @param guestUserId - The UID of the guest user
   */
  async handleMessagesWithReactions(msgDoc: QueryDocumentSnapshot<DocumentData>, guestUserId: string) {
    const msgRef = msgDoc.ref;
    const reactionsColRef = collection(msgRef, 'reactions');
    const reactionNamesSnap = await getDocs(reactionsColRef);
    await this.deleteGuestUserIdAsSenderOfReactions(reactionNamesSnap, guestUserId);
    await this.setHasReactions(reactionsColRef, msgRef);
  }

  /**
   * Deletes all reactions created by the guest user across all reaction documents of a message.
   *
   * @param reactionNamesSnap - The snapshot of reaction documents
   * @param guestUserId - The UID of the guest user
   */
  async deleteGuestUserIdAsSenderOfReactions(reactionNamesSnap: QuerySnapshot<DocumentData>, guestUserId: string) {
    const localBatch = writeBatch(this.firestore);
    for (const reactionDoc of reactionNamesSnap.docs) await this.deleteGuestReactionIfExists(reactionDoc.ref, guestUserId, localBatch);
    await localBatch.commit();
  }

  /**
   * Removes a guest user from a reaction document if they exist in the user list.
   *
   * @param reactionDocRef - The Firestore document reference of the reaction
   * @param guestUserId - The UID of the guest user
   * @param batch - The Firestore batch instance
   */
  async deleteGuestReactionIfExists(reactionDocRef: DocumentReference<DocumentData>, guestUserId: string, batch: WriteBatch) {
    const reactionSnap = await getDoc(reactionDocRef);
    if (!reactionSnap.exists()) return;
    const users = reactionSnap.data()['users'] as string[] | undefined;
    if (!users || !users.includes(guestUserId)) return;
    const updatedUsers = this.removeGuestFromUsersArray(users, guestUserId);
    this.applyReactionChange(reactionDocRef, updatedUsers, batch);
  }

  /**
   * Removes the guest user ID from a given array of reaction users.
   * Returns the filtered array without the guest user ID.
   *
   * @param users - The array of user IDs
   * @param guestUserId - The UID of the guest user
   */
  removeGuestFromUsersArray(users: string[], guestUserId: string): string[] {
    return users.filter((id) => id !== guestUserId);
  }

  /**
   * Applies a reaction update or deletion based on the remaining users.
   *
   * @param reactionDocRef - The Firestore reaction document reference
   * @param updatedUsers - The updated list of user IDs
   * @param batch - The Firestore batch instance
   */
  applyReactionChange(reactionDocRef: DocumentReference<DocumentData>, updatedUsers: string[], batch: WriteBatch) {
    if (updatedUsers.length === 0) {
      batch.delete(reactionDocRef);
      return;
    }
    batch.update(reactionDocRef, { users: updatedUsers });
  }

  /**
   * Updates the `hasReactions` flag of a message depending on whether reactions remain.
   *
   * @param reactionsColRef - The Firestore collection reference of reactions
   * @param msgRef - The Firestore document reference of the message
   */
  async setHasReactions(reactionsColRef: CollectionReference<DocumentData>, msgRef: DocumentReference<DocumentData>) {
    const remainingReactionNamesSnap = await getDocs(reactionsColRef);
    if (remainingReactionNamesSnap.empty) await updateDoc(msgRef, { hasReactions: false });
  }

  /**
   * Handles all messages with answers, removing guest answers and updating counters.
   *
   * @param msgDoc - The message document snapshot
   * @param guestUserId - The UID of the guest user
   */
  async handleMessagesWithAnswers(msgDoc: QueryDocumentSnapshot<DocumentData>, guestUserId: string) {
    const msgRef = msgDoc.ref;
    const answersColRef = collection(msgRef, 'answers');
    const answersIdsSnap = await getDocs(answersColRef);
    await this.deleteAnswerfromGuestUserId(answersIdsSnap, guestUserId);
    await this.setAnsCounter(answersColRef, msgRef);
  }

  /**
   * Deletes all answers made by the guest user within a message.
   *
   * @param answersIdsSnap - The snapshot of answer documents
   * @param guestUserId - The UID of the guest user
   */
  async deleteAnswerfromGuestUserId(answersIdsSnap: QuerySnapshot<DocumentData>, guestUserId: string) {
    const localBatch = writeBatch(this.firestore);
    for (const answerDoc of answersIdsSnap.docs) await this.deleteGuestsAnswerIfExists(answerDoc.ref, guestUserId, localBatch);
    await localBatch.commit();
  }

  /**
   * Deletes a specific answer document if it was created by the guest user.
   *
   * @param answerDocRef - The Firestore document reference of the answer
   * @param guestUserId - The UID of the guest user
   * @param localBatch - The Firestore batch instance
   */
  async deleteGuestsAnswerIfExists(answerDocRef: DocumentReference<DocumentData>, guestUserId: string, localBatch: WriteBatch) {
    const answerSnap = await getDoc(answerDocRef);
    if (!answerSnap.exists()) return;
    const answerData = answerSnap.data();
    const users = answerData['senderId'];
    if (users === guestUserId) localBatch.delete(answerDocRef);
  }

  /**
   * Updates the answer counter and last created timestamp for a message or clears them if no answers remain.
   *
   * @param answersColRef - The Firestore collection reference of answers.
   * @param msgRef - The Firestore document reference of the message.
   */
  async setAnsCounter(answersColRef: CollectionReference<DocumentData>, msgRef: DocumentReference<DocumentData>) {
    const remainingAnswerSnap = await getDocs(answersColRef);
    if (remainingAnswerSnap.empty) {
      await updateDoc(msgRef, { ansCounter: deleteField(), ansLastCreatedAt: deleteField() });
    } else await this.handleRemainingAnswers(remainingAnswerSnap, msgRef);
  }

  /**
   * Recalculates the latest answer timestamp and updates the message’s answer metadata.
   *
   * @param remainingAnswerSnap - The snapshot of remaining answer documents
   * @param msgRef - The Firestore message document reference
   */
  async handleRemainingAnswers(remainingAnswerSnap: QuerySnapshot<DocumentData>, msgRef: DocumentReference<DocumentData>) {
    const createdAts = remainingAnswerSnap.docs.map((doc) => doc.data()['createdAt']);
    const newestCreatedAt = createdAts.reduce((latest, current) => { return current.toMillis() > latest.toMillis() ? current : latest });
    await updateDoc(msgRef, { ansCounter: remainingAnswerSnap.size, ansLastCreatedAt: newestCreatedAt });
  }
}