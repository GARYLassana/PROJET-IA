import { Injectable } from '@angular/core';
import { 
  Auth,
  GoogleAuthProvider,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  createUserWithEmailAndPassword,
  UserCredential
} from '@angular/fire/auth';
import { 
  Firestore,
  doc,
  setDoc
} from '@angular/fire/firestore';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  uid: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: 'admin' | 'user';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private recaptchaVerifier: RecaptchaVerifier | null = null;

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();
    this.initializeAuthListener();
  }

  private initializeAuthListener() {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await this.getUserDocument(user.uid);
        this.currentUserSubject.next(userDoc as User);
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  private async getUserDocument(uid: string): Promise<User | null> {
    try {
      const userDocRef = doc(this.firestore, 'users', uid);
      const userDoc = await userDocRef.get();
      return userDoc.exists() ? userDoc.data() as User : null;
    } catch (error) {
      console.error('Error getting user document:', error);
      return null;
    }
  }

  // Initialiser le recaptcha
  initRecaptcha(buttonId: string) {
    if (!this.recaptchaVerifier) {
      this.recaptchaVerifier = new RecaptchaVerifier(this.auth, buttonId, {
        size: 'invisible'
      });
    }
    return this.recaptchaVerifier;
  }

  // Envoyer le code de vérification par SMS
  async sendVerificationCode(phoneNumber: string, buttonId: string): Promise<string> {
    try {
      const verifier = this.initRecaptcha(buttonId);
      const confirmationResult = await signInWithPhoneNumber(this.auth, phoneNumber, verifier);
      return confirmationResult.verificationId;
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw this.handleAuthError(error);
    }
  }

  async loginWithGoogle(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      
      if (result.user) {
        await this.createOrUpdateUserDocument(result.user.uid, {
          uid: result.user.uid,
          email: result.user.email,
          role: 'user'
        });
      }

      return result;
    } catch (error) {
      console.error('Google login error:', error);
      throw this.handleAuthError(error);
    }
  }

  private async createOrUpdateUserDocument(uid: string, userData: Partial<User>) {
    try {
      const userDocRef = doc(this.firestore, 'users', uid);
      await setDoc(userDocRef, userData, { merge: true });
    } catch (error) {
      console.error('Error updating user document:', error);
      throw error;
    }
  }

  private handleAuthError(error: any): Error {
    let message = 'Une erreur est survenue';
    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'Cette adresse email est déjà utilisée';
          break;
        case 'auth/invalid-email':
          message = 'Adresse email invalide';
          break;
        case 'auth/operation-not-allowed':
          message = 'Opération non autorisée';
          break;
        case 'auth/weak-password':
          message = 'Le mot de passe est trop faible';
          break;
        case 'auth/user-disabled':
          message = 'Ce compte a été désactivé';
          break;
        case 'auth/user-not-found':
          message = 'Utilisateur non trouvé';
          break;
        case 'auth/wrong-password':
          message = 'Mot de passe incorrect';
          break;
        case 'auth/invalid-verification-code':
          message = 'Code de vérification invalide';
          break;
        case 'auth/invalid-verification-id':
          message = 'ID de vérification invalide';
          break;
      }
    }
    return new Error(message);
  }

  async registerWithEmailPassword(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    phoneNumber: string
  ): Promise<UserCredential> {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      
      if (result.user) {
        await this.createOrUpdateUserDocument(result.user.uid, {
          uid: result.user.uid,
          email,
          firstName,
          lastName,
          phoneNumber,
          role: 'user'
        });
      }

      return result;
    } catch (error) {
      console.error('Register error:', error);
      throw this.handleAuthError(error);
    }
  }

  async loginWithEmailPassword(email: string, password: string): Promise<UserCredential> {
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('Firebase auth result:', credential);
      
      if (!credential.user) {
        throw new Error('No user data received after authentication');
      }

      const userDoc = await this.getUserDocument(credential.user.uid);
      console.log('Firestore user document:', userDoc?.data());
      
      if (!userDoc?.exists) {
        console.error('User document not found in Firestore');
        await this.auth.signOut();
        throw new Error('Erreur de configuration du compte utilisateur');
      }

      return credential;
    } catch (error: any) {
      console.error('Login error details:', error);
      
      if (error?.code === 'auth/invalid-login-credentials' || error?.code === 'auth/invalid-credential') {
        throw new Error('Email ou mot de passe incorrect');
      } else if (error?.code === 'auth/user-not-found') {
        throw new Error('Aucun compte trouvé avec cet email');
      } else if (error?.code === 'auth/wrong-password') {
        throw new Error('Mot de passe incorrect');
      } else {
        throw new Error(error.message || 'Erreur lors de la connexion');
      }
    }
  }

  async logout() {
    try {
      await this.auth.signOut();
      this.currentUserSubject.next(null);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  isAdmin(): Observable<boolean> {
    return this.currentUser.pipe(
      map(user => {
        console.log('Checking admin status:', user?.role);
        return user?.role === 'admin';
      })
    );
  }
}
