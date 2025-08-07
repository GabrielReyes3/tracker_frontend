import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { AuthService } from '../../core/auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, InputTextModule, PasswordModule, ButtonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  username = '';
  password = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  login() {
    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        const token = response.token;
        localStorage.setItem('token', token);

        const payload = JSON.parse(atob(token.split('.')[1]));

        if (payload.role === 'admin') {
          this.router.navigate(['/admin']);
        } else if (payload.role === 'delivery') {
          this.router.navigate(['/delivery']);
        }
      },
      error: (err) => {
        console.error('Error en login:', err);
        this.toastr.error('Credenciales inválidas');
      }
    });
  }
}
