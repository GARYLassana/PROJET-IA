import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

/**
 * Composant de connexion
 * Gère l'authentification des utilisateurs
 * 
 * Comptes disponibles :
 * - Admin : lassanagary300@gmail.com
 * - Utilisateur : battifrance0@gmail.com
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;
  isResettingPassword: boolean = false;
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onLogin(form: NgForm) {
    if (this.isLoading) return; // Empêcher les soumissions multiples
    if (!form.valid) {
      this.errorMessage = 'Veuillez remplir tous les champs correctement';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.authService.loginWithEmailPassword(this.email, this.password);
      console.log('Login successful, redirecting to dashboard');
      await this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error('Login error in component:', error);
      this.errorMessage = error.message;
      this.isLoading = false; // Réactiver le bouton en cas d'erreur
    }
  }

  async onGoogleLogin() {
    if (this.isLoading) return; // Empêcher les clics multiples

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.authService.loginWithGoogle();
      console.log('Google login successful, redirecting to dashboard');
      await this.router.navigate(['/dashboard']);
    } catch (error: any) {
      console.error('Google login error in component:', error);
      this.errorMessage = error.message;
      this.isLoading = false; // Réactiver le bouton en cas d'erreur
    }
  }

  async onResetPassword() {
    if (this.isResettingPassword) return; // Empêcher les clics multiples
    if (!this.email) {
      this.errorMessage = 'Veuillez entrer votre email';
      return;
    }

    this.isResettingPassword = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.authService.resetPassword(this.email);
      this.successMessage = 'Un email de réinitialisation a été envoyé à votre adresse email';
    } catch (error: any) {
      console.error('Password reset error in component:', error);
      this.errorMessage = error.message;
    } finally {
      this.isResettingPassword = false;
    }
  }
}
