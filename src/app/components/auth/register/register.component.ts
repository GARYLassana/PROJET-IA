import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  phoneNumber = '';
  verificationCode = '';
  codeSent = false;
  verificationId = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private formBuilder: FormBuilder,
    private modalService: NgbModal
  ) {
    this.registerForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(formGroup: FormGroup) {
    const password = formGroup.get('password').value;
    const confirmPassword = formGroup.get('confirmPassword').value;
    if (password !== confirmPassword) {
      formGroup.get('confirmPassword').setErrors({ mismatch: true });
    } else {
      formGroup.get('confirmPassword').setErrors(null);
    }
  }

  async startPhoneSignIn() {
    const modal = document.getElementById('phoneVerificationModal');
    if (modal) {
      this.modalService.open(modal);
    }
  }

  async sendVerificationCode() {
    try {
      this.isLoading = true;
      this.verificationId = await this.authService.sendVerificationCode(
        this.phoneNumber,
        'phone-sign-in'
      );
      this.codeSent = true;
    } catch (error) {
      console.error('Error sending code:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async verifyCode() {
    try {
      this.isLoading = true;
      await this.authService.verifyPhoneNumber(this.verificationId, this.verificationCode);
      this.modalService.dismissAll();
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Error verifying code:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithGoogle() {
    try {
      this.isLoading = true;
      await this.authService.loginWithGoogle();
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Error with Google login:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async onGoogleLogin() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.loginWithGoogle();
      await this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage = error.message;
      this.isLoading = false;
    }
  }

  async onFacebookLogin() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.loginWithFacebook();
      await this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage = error.message;
      this.isLoading = false;
    }
  }

  async onLinkedInLogin() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.loginWithLinkedIn();
      await this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage = error.message;
      this.isLoading = false;
    }
  }

  async onRegister() {
    if (this.isLoading) return;
    
    // Validation de base
    if (!this.registerForm.valid) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.authService.registerWithEmailPassword(
        this.registerForm.get('email').value,
        this.registerForm.get('password').value,
        this.registerForm.get('firstName').value,
        this.registerForm.get('lastName').value,
        this.registerForm.get('phoneNumber').value
      );
      this.successMessage = 'Compte créé avec succès !';
      setTimeout(() => this.router.navigate(['/dashboard']), 1500);
    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.isLoading = false;
    }
  }
}
