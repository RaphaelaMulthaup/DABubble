export interface UserInterface {
  contacts?: {
    [contactId: string]: {
      userId: string;
      chatId: string;
    };
  };
  uid: string;
  name: string;
  email: string;
  photoUrl?: string;
  authProvider: 'password' | 'google.com' | 'anonymous';
  active: boolean;
  role: 'user' | 'admin';
}
