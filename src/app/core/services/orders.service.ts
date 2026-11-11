import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environments';

import {
  CreateOrderRequest,
  Customer,
  Order,
  PaginatedResponse,
  ProductOption,
  WarehouseOption,
} from '../../features/orders/models/order.models';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}`;

  getCustomers(): Observable<PaginatedResponse<Customer>> {
    return this.http.get<PaginatedResponse<Customer>>(`${this.baseUrl}/customers/`);
  }

  createCustomer(payload: Partial<Customer>): Observable<Customer> {
    return this.http.post<Customer>(`${this.baseUrl}/customers/`, payload);
  }

  getOrders(status = '', search = '', page = 1): Observable<PaginatedResponse<Order>> {
    let params = new HttpParams().set('page', page);

    if (status) {
      params = params.set('status', status);
    }

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PaginatedResponse<Order>>(`${this.baseUrl}/orders/`, { params });
  }

  getOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.baseUrl}/orders/${id}/`);
  }

  createOrder(payload: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders/`, payload);
  }

  updateOrder(id: number, payload: CreateOrderRequest): Observable<Order> {
    return this.http.put<Order>(`${this.baseUrl}/orders/${id}/`, payload);
  }

  submitOrder(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders/${id}/submit/`, {});
  }

  confirmOrder(id: number, warehouseId: number): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders/${id}/confirm/`, {
      warehouse_id: warehouseId,
    });
  }

  startProcessing(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders/${id}/processing/`, {});
  }

  shipOrder(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders/${id}/ship/`, {});
  }

  deliverOrder(id: number): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders/${id}/deliver/`, {});
  }

  cancelOrder(id: number, reason: string): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders/${id}/cancel/`, { reason });
  }

  getProducts(): Observable<PaginatedResponse<ProductOption>> {
    return this.http.get<PaginatedResponse<ProductOption>>(`${this.baseUrl}/inventory/products/`);
  }

  getWarehouses(): Observable<PaginatedResponse<WarehouseOption>> {
    return this.http.get<PaginatedResponse<WarehouseOption>>(
      `${this.baseUrl}/inventory/warehouses/`,
    );
  }
}
