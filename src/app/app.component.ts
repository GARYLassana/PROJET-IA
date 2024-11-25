import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'angular-bootstrap-app';

  constructor(
    private auth: Auth,
    private firestore: Firestore
  ) {}

  ngOnInit() {
    // Vérifier que Firebase est initialisé
    console.log('Firebase Auth initialized:', !!this.auth);
    console.log('Firebase Firestore initialized:', !!this.firestore);
  }
}
