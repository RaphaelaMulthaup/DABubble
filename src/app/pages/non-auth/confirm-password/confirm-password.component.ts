import { Component, EventEmitter, inject, Output } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FormControl, FormsModule, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { Firestore, collection, collectionData, query, where, getDocs } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { NgZone } from '@angular/core';

import { AngularFirestore } from '@angular/fire/compat/firestore'; // falls du compat benutzt
import { Injectable } from '@angular/core';

import { sendPasswordResetEmail } from 'firebase/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-password',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './confirm-password.component.html',
  styleUrl: './confirm-password.component.scss'
})
export class ConfirmPasswordComponent {
  @Output() close = new EventEmitter<void>();

 confirmForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });
  showErrorMessage: boolean = false;

  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);

  constructor(private zone: NgZone) { }

async onSubmit() {
  this.showErrorMessage = false;

  this.zone.run(async () => {
    let email = this.confirmForm.get('email')?.value;
    email = email.trim().toLowerCase(); // Kleinbuchstaben & trim

    console.log('Gesuchte E-Mail:', email);

    try {
      const userRef = collection(this.firestore, 'users');
      const q = query(userRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      console.log('Anzahl gefundener Dokumente:', querySnapshot.size);

      if (querySnapshot.empty) {
        console.log('E-Mail NICHT vorhanden');
      } else {
        console.log('E-Mail vorhanden');
        // Optional: Infos der gefundenen Dokumente
        querySnapshot.forEach(doc => {
          console.log('Gefundenes Dokument:', doc.id, doc.data());
        });
      }
    } catch (error) {
      console.error('Fehler bei der Überprüfung:', error);
      this.showErrorMessage = true;
    }
  });
}

}
