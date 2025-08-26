import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { UserService } from '../../../../services/user.service';
import { AuthService } from '../../../../services/auth.service';
import { ChatService } from '../../../../services/chat.service';
import { forkJoin, Observable, of, switchMap, map, combineLatest } from 'rxjs';
import { UserInterface } from '../../../../shared/models/user.interface';
import { Firestore } from '@angular/fire/firestore';
import { ContactListItemComponent } from './contact-list-item/contact-list-item.component';

@Component({
  selector: 'app-contacts-list',
  imports: [CommonModule, AsyncPipe, ContactListItemComponent],
  templateUrl: './contacts-list.component.html',
  styleUrls: ['./contacts-list.component.scss'],
})
export class ContactsListComponent implements OnInit {
  contacts$: Observable<UserInterface[]> = of([]);
  currentUserId: string | null = null;
  directMessagesVisible = true;

  private firestore: Firestore = inject(Firestore);

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    // Auf eingeloggten User warten
    this.authService.user$.subscribe((user) => {
      if (!user) {
        this.currentUserId = null;
        this.contacts$ = of([]);
        return;
      }

      this.currentUserId = user.uid;

      // Kontakte laden
      this.contacts$ = this.chatService
        .getChatsForUser(this.currentUserId)
        .pipe(
          map((chats) =>
            chats.map((chat) =>
              this.chatService.getOtherUserId(chat.id!, this.currentUserId!)
            )
          ),
          switchMap((contactIds) => {
            console.log(contactIds);

            if (contactIds.length === 0) return of([]);
            return combineLatest(
              contactIds.map((id) => this.userService.getUserById(id))
            );
          })
        );
    });
  }
}

// import { Component, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { UserService } from '../../../../services/user.service';
// import { AuthService } from '../../../../services/auth.service';
// import { forkJoin, map, Observable, switchMap } from 'rxjs';
// import { UserInterface } from '../../../../shared/models/user.interface';
// import { AsyncPipe } from '@angular/common';
// import { doc, Firestore } from '@angular/fire/firestore';
// import { ContactListItemComponent } from './contact-list-item/contact-list-item.component';
// import { ChatService } from '../../../../services/chat.service';

// @Component({
//   selector: 'app-contacts-list',
//   imports: [CommonModule, AsyncPipe, ContactListItemComponent],
//   templateUrl: './contacts-list.component.html',
//   styleUrl: './contacts-list.component.scss',
// })
// export class ContactsListComponent {
//   // Observable containing the list of all users  //Das dürfen dann später nur die Kontakte des Currentusers sein
//   contacts$: Observable<UserInterface[]>;

//   // ID of the currently logged-in user
//   currentUserId: string | null = null;

//   // // Array of contact IDs for the current user
//   // contactIds: string[] = [];

//   // // Object containing the contacts with userId and chatId for each contact
//   // contacts: { [contactId: string]: { userId: string; chatId: string } } = {};

//   directMessagesVisible: boolean = true;

//   // Firestore instance
//   private firestore: Firestore = inject(Firestore);

//   constructor(
//     private userService: UserService,
//     private authService: AuthService,
//     private chatService: ChatService
//   ) {
//     // Fetch all users //Das dürfen dann später nur die Kontakte des Currentusers sein
//     this.currentUserId = this.authService.currentUser.uid;
//     let contactIds: string[] = [];

//     // this.chatService.getChatsForUser(this.currentUserId).subscribe((chats) => {
//     //   contactIds = chats.map((chat) =>
//     //     this.chatService.getOtherUserId((chat as any).id, this.currentUserId!)
//     //   );

//     //   console.log(contactIds);
//     // });

//     this.contacts$ = this.chatService.getChatsForUser(this.currentUserId!).pipe(
//       map((chats) =>
//         chats.map((chat) =>
//           this.chatService.getOtherUserId((chat as any).id, this.currentUserId!)
//         )
//       ),
//       switchMap((contactIds) => {
//         // Ein Observable aus einem Array von Observables erstellen
//         const userObservables = contactIds.map((id) =>
//           this.userService.getUserById(id)
//         );
//         // Mit forkJoin alle Observables zu einem Array zusammenführen
//         return forkJoin(userObservables);
//       })
//     );

//     // this.contacts$;

//     // }

//     // // Subscribe to the current authenticated user
//     // this.authService.user$.subscribe((user) => {
//     //   this.currentUserId = user?.uid ?? null;
//     //   if (this.currentUserId) {
//     //     // Fetch current user's contact list
//     //     this.userService
//     //       .getUserById(this.currentUserId)
//     //       .subscribe((userData) => {
//     //         this.contacts = userData.contacts || {};
//     //         this.contactIds = Object.keys(this.contacts); // Extract only the IDs
//     //       });
//     //   }
//     // });
//   }

//   // /**
//   //  * Removes a contact from the current user's contact list
//   //  * @param contactId ID of the contact to remove
//   //  */
//   // removeContact(contactId: string) {
//   //   if (!this.currentUserId) return;

//   //   this.userService
//   //     .removeContactFromUser(this.currentUserId, contactId)
//   //     .then(() => alert('Contact removed successfully!'))
//   //     .catch((error) => console.error(error));
//   // }

//   // /**
//   //  * Checks if a given user is already a contact
//   //  * @param contactId ID of the user to check
//   //  * @returns true if the user is already a contact, false otherwise
//   //  */
//   // isAlreadyContact(contactId: string): boolean {
//   //   return contactId in this.contacts;
//   // }
// }
