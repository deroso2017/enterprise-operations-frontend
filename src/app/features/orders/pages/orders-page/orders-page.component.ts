import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { finalize } from 'rxjs';
import { toast } from 'ngx-sonner';

import { OrdersService } from '../../../../core/services/orders.service';
import { AuthService } from '../../../../core/services/auth.service';

import {
  Customer,
  Order,
  OrderStatus,
  ProductOption,
  WarehouseOption,
} from '../../models/order.models';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './orders-page.component.html',
})
export class OrdersPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ordersService = inject(OrdersService);
  readonly authService = inject(AuthService);

  orders: Order[] = [];
  customers: Customer[] = [];
  products: ProductOption[] = [];
  warehouses: WarehouseOption[] = [];

  selectedOrder: Order | null = null;
  selectedStatus = '';
  searchTerm = '';

  loading = false;
  submitting = false;
  showCreateForm = false;

  readonly orderForm = this.fb.nonNullable.group({
    customer_id: [0, [Validators.required, Validators.min(1)]],
    required_date: [''],
    tax_rate: ['19.00', Validators.required],
    notes: [''],
    items: this.fb.array([this.createItemForm()]),
  });

  readonly customerForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    company: [''],
    email: [''],
    phone: [''],
    address: [''],
    city: [''],
    postal_code: [''],
    country: ['Germany'],
  });

  readonly confirmationForm = this.fb.nonNullable.group({
    warehouse_id: [0, [Validators.required, Validators.min(1)]],
  });

  readonly cancellationForm = this.fb.nonNullable.group({
    reason: ['', Validators.required],
  });

  get orderItems(): FormArray {
    return this.orderForm.controls.items;
  }

  get isManagerOrAdmin(): boolean {
    const role = this.authService.currentUser()?.role;
    return role === 'ADMIN' || role === 'MANAGER';
  }

  ngOnInit(): void {
    this.loadPage();
  }

  private createItemForm() {
    return this.fb.nonNullable.group({
      product_id: [0, [Validators.required, Validators.min(1)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
    });
  }

  addItem(): void {
    this.orderItems.push(this.createItemForm());
  }

  removeItem(index: number): void {
    if (this.orderItems.length > 1) {
      this.orderItems.removeAt(index);
    }
  }

  loadPage(): void {
    this.loading = true;

    let completed = 0;
    let failed = false;

    const finish = (): void => {
      completed += 1;

      if (completed === 4) {
        this.loading = false;

        if (failed) {
          toast.error('Some order data could not be loaded.');
        }
      }
    };

    this.ordersService.getOrders(this.selectedStatus, this.searchTerm).subscribe({
      next: (response) => {
        this.orders = response.results;
        finish();
      },
      error: () => {
        failed = true;
        finish();
      },
    });

    this.ordersService.getCustomers().subscribe({
      next: (response) => {
        this.customers = response.results;
        finish();
      },
      error: () => {
        failed = true;
        finish();
      },
    });

    this.ordersService.getProducts().subscribe({
      next: (response) => {
        this.products = response.results;
        finish();
      },
      error: () => {
        failed = true;
        finish();
      },
    });

    this.ordersService.getWarehouses().subscribe({
      next: (response) => {
        this.warehouses = response.results;
        finish();
      },
      error: () => {
        failed = true;
        finish();
      },
    });
  }

  filterOrders(): void {
    this.ordersService.getOrders(this.selectedStatus, this.searchTerm).subscribe({
      next: (response) => (this.orders = response.results),
      error: () => toast.error('Could not filter orders.'),
    });
  }

  createOrder(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      toast.error('Please fix the errors in the order form.');
      return;
    }

    const value = this.orderForm.getRawValue();
    const productIds = value.items.map((item) => item.product_id);

    if (new Set(productIds).size !== productIds.length) {
      toast.error('Each product can only be added once.');
      return;
    }

    this.submitting = true;

    this.ordersService
      .createOrder({
        customer_id: value.customer_id,
        required_date: value.required_date || null,
        tax_rate: value.tax_rate,
        notes: value.notes,
        items: value.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      })
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (order) => {
          this.orders = [order, ...this.orders];
          this.selectedOrder = order;
          this.showCreateForm = false;
          toast.success(`Order ${order.order_number} created successfully.`);
          this.resetOrderForm();
        },
        error: (error) => this.handleError(error),
      });
  }

  createCustomer(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      toast.error('Please fill in all required customer fields.');
      return;
    }

    this.submitting = true;

    this.ordersService
      .createCustomer(this.customerForm.getRawValue())
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (customer) => {
          this.customers = [...this.customers, customer];
          this.orderForm.controls.customer_id.setValue(customer.id);
          this.customerForm.reset({
            name: '',
            company: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            postal_code: '',
            country: 'Germany',
          });
          toast.success('Customer created successfully.');
        },
        error: (error) => this.handleError(error),
      });
  }

  viewOrder(order: Order): void {
    this.ordersService.getOrder(order.id).subscribe({
      next: (result) => (this.selectedOrder = result),
      error: () => toast.error('Could not load order details.'),
    });
  }

  submitOrder(order: Order): void {
    this.runAction(this.ordersService.submitOrder(order.id), 'Order submitted for approval.');
  }

  confirmOrder(order: Order): void {
    const warehouseId = this.confirmationForm.controls.warehouse_id.value;

    if (warehouseId < 1) {
      toast.error('Select a warehouse before confirming.');
      return;
    }

    this.runAction(
      this.ordersService.confirmOrder(order.id, warehouseId),
      'Order confirmed and stock reserved.',
    );
  }

  startProcessing(order: Order): void {
    this.runAction(this.ordersService.startProcessing(order.id), 'Order processing started.');
  }

  shipOrder(order: Order): void {
    this.runAction(this.ordersService.shipOrder(order.id), 'Order shipped and inventory deducted.');
  }

  deliverOrder(order: Order): void {
    this.runAction(this.ordersService.deliverOrder(order.id), 'Order marked as delivered.');
  }

  cancelOrder(order: Order): void {
    const reason = this.cancellationForm.controls.reason.value.trim();

    if (!reason) {
      toast.error('Enter a cancellation reason.');
      return;
    }

    this.runAction(this.ordersService.cancelOrder(order.id, reason), 'Order cancelled.');
  }

  private runAction(
    request: ReturnType<OrdersService['submitOrder']>,
    successMessage: string,
  ): void {
    this.submitting = true;

    request.pipe(finalize(() => (this.submitting = false))).subscribe({
      next: (updatedOrder) => {
        toast.success(successMessage);
        this.selectedOrder = updatedOrder;
        this.orders = this.orders.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order,
        );
        this.filterOrders();
        this.cancellationForm.reset({ reason: '' });
      },
      error: (error) => this.handleError(error),
    });
  }

  private resetOrderForm(): void {
    this.orderForm.reset({
      customer_id: 0,
      required_date: '',
      tax_rate: '19.00',
      notes: '',
    });

    while (this.orderItems.length > 1) {
      this.orderItems.removeAt(this.orderItems.length - 1);
    }

    this.orderItems.at(0).reset({
      product_id: 0,
      quantity: 1,
    });
  }

  private handleError(error: { error?: { detail?: string; [key: string]: unknown } }): void {
    const apiError = error.error;

    const message =
      apiError?.detail ??
      Object.values(apiError ?? {})
        .flat()
        .filter((value): value is string => typeof value === 'string')
        .join(' ') ??
      'The operation failed. Please check your input.';

    toast.error(message);
  }
}
