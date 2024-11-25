import { initializeApp } from '@angular/fire/app';
import { getAuth } from '@angular/fire/auth';
import { getFirestore } from '@angular/fire/firestore';
import { getStorage } from '@angular/fire/storage';
import { environment } from '../environments/environment';

// Initialize Firebase
export const app = initializeApp(environment.firebase);

// Initialize Firebase services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
