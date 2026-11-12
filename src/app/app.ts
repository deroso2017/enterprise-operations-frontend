import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NgxSonnerToaster } from 'ngx-sonner';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { Navbar } from './shared/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgxSonnerToaster, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly theme = inject(ThemeService);

  ngOnInit() {
    this.theme.init();
  }
}
