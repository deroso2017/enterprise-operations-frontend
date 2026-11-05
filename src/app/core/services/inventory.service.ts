import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

import {
  Category,
  InventorySummary,
  PaginatedResponse,
  Product,
  StockAdjustmentRequest,
  StockLevel,
  StockMovement,
  StockTransferRequest,
  StockTransferResponse,
  Warehouse,
} from '../../features/inventory/models/inventory.models';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = `${environment.apiUrl}/inventory`;

  getSummary(): Observable<InventorySummary> {
    return this.http.get<InventorySummary>(`${this.baseUrl}/summary/`);
  }

  getCategories(): Observable<PaginatedResponse<Category>> {
    return this.http.get<PaginatedResponse<Category>>(`${this.baseUrl}/categories/`);
  }

  createCategory(payload: { name: string; description: string }): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/categories/`, payload);
  }

  getWarehouses(): Observable<PaginatedResponse<Warehouse>> {
    return this.http.get<PaginatedResponse<Warehouse>>(`${this.baseUrl}/warehouses/`);
  }

  createWarehouse(payload: {
    code: string;
    name: string;
    location: string;
    is_active: boolean;
  }): Observable<Warehouse> {
    return this.http.post<Warehouse>(`${this.baseUrl}/warehouses/`, payload);
  }

  getProducts(search = '', page = 1): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams().set('page', page);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginatedResponse<Product>>(`${this.baseUrl}/products/`, { params });
  }

  createProduct(payload: {
    sku: string;
    name: string;
    description: string;
    category: number;
    unit_price: string;
    reorder_level: number;
    is_active: boolean;
  }): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/products/`, payload);
  }

  getStockLevels(lowStock = false): Observable<PaginatedResponse<StockLevel>> {
    let params = new HttpParams();

    if (lowStock) {
      params = params.set('low_stock', 'true');
    }

    return this.http.get<PaginatedResponse<StockLevel>>(`${this.baseUrl}/stock/`, { params });
  }

  getMovements(): Observable<PaginatedResponse<StockMovement>> {
    return this.http.get<PaginatedResponse<StockMovement>>(`${this.baseUrl}/movements/`);
  }

  adjustStock(payload: StockAdjustmentRequest): Observable<StockMovement> {
    return this.http.post<StockMovement>(`${this.baseUrl}/stock/adjust/`, payload);
  }

  transferStock(payload: StockTransferRequest): Observable<StockTransferResponse> {
    return this.http.post<StockTransferResponse>(`${this.baseUrl}/stock/transfer/`, payload);
  }
}
