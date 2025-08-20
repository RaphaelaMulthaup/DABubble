import { Component, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FormControl, FormsModule, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { Firestore, collection, collectionData, query, where, getDocs } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { NgZone } from '@angular/core';

import { sendPasswordResetEmail } from 'firebase/auth';

@Component({
  selector: 'app-confirm-password',
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './confirm-password.component.html',
  styleUrl: './confirm-password.component.scss'
})
export class ConfirmPasswordComponent {
 confirmForm: FormGroup = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });
  showErrorMessage: boolean = false;

  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);

  constructor(private zone: NgZone) { }

  async onSubmit() {
    console.log('Form Submitted');
    
    this.zone.run(async () => {
      let email = this.confirmForm.get('email')?.value;

      try {
        let userRef = collection(this.firestore, 'users');
        let q = query(userRef, where('email', '==', email));
        let querysnapshot = await getDocs(q);

        if (querysnapshot.empty) {
          this.showErrorMessage = true;
        } else {
          await sendPasswordResetEmail(this.auth, email);
          alert('Link ist unterwegs');
          this.showErrorMessage = false;
        }
      } catch (error) {
        console.error('Fheler beim zurücksetzen', error);
        this.showErrorMessage = true;
      }
    });
  }

}
