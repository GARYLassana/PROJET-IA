import { initializeApp } from '@angular/fire/app';
import { environment } from '../environments/environment';

export const firebaseApp = initializeApp(environment.firebase);
