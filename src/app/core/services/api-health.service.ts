import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export interface ApiHealth {
  status: 'ok';
  service: string;
  database: 'ok';
}

@Injectable({
  providedIn: 'root',
})
export class ApiHealthService {
  private readonly http = inject(HttpClient);

  getHealth(): Observable<ApiHealth> {
    return this.http.get<ApiHealth>(`${environment.apiUrl}/health/`);
  }
}
