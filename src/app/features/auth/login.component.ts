import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  protected supabase = inject(SupabaseService);
  private router = inject(Router);

  email = '';
  password = '';

  async signIn() {
    await this.supabase.signIn(this.email, this.password);
    if (!this.supabase.error() && this.supabase.session()) {
      this.router.navigate(['/dashboard']);
    }
  }
}
