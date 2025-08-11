export interface UserInterface {
  uid: string;
  name: string;
  email: string;
  photoUrl?: string;
  authProvider: 'password' | 'google.com';
  active: boolean;
  contacts: string[];
}