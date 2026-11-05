import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { toast } from 'ngx-sonner';

import { InventoryService } from '../../../../core/services/inventory.service';

import {
  Category,
  InventorySummary,
  Product,
  StockLevel,
  StockMovement,
  Warehouse,
} from '../../models/inventory.models';

@Component({
  selector: 'app-inventory-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inventory-page.component.html',
})
export class InventoryPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly inventoryService = inject(InventoryService);

  summary: InventorySummary | null = null;

  categories: Category[] = [];
  warehouses: Warehouse[] = [];
  products: Product[] = [];
  stockLevels: StockLevel[] = [];
  movements: StockMovement[] = [];

  searchTerm = '';
  showLowStockOnly = false;
  loading = false;
  submitting = false;

  readonly productForm = this.fb.nonNullable.group({
    sku: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    category: [0, [Validators.required, Validators.min(1)]],
    unit_price: ['0.00', [Validators.required, Validators.min(0)]],
    reorder_level: [10, [Validators.required, Validators.min(0)]],
  });

  readonly categoryForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
  });

  readonly warehouseForm = this.fb.nonNullable.group({
    code: ['', Validators.required],
    name: ['', Validators.required],
    location: [''],
  });

  readonly adjustmentForm = this.fb.nonNullable.group({
    product: [0, [Validators.required, Validators.min(1)]],
    warehouse: [0, [Validators.required, Validators.min(1)]],
    direction: ['IN' as 'IN' | 'OUT', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    reference: [''],
    notes: ['', Validators.required],
  });

  readonly transferForm = this.fb.nonNullable.group({
    product: [0, [Validators.required, Validators.min(1)]],
    source_warehouse: [0, [Validators.required, Validators.min(1)]],
    destination_warehouse: [0, [Validators.required, Validators.min(1)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    reference: [''],
    notes: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;

    this.inventoryService.getSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
        this.loadReferenceData();
      },
      error: () => {
        this.loading = false;
        toast.error('Could not load inventory summary.');
      },
    });
  }

  private loadReferenceData(): void {
    let completed = 0;
    let failed = false;

    const finish = (): void => {
      completed += 1;

      if (completed === 5) {
        this.loading = false;

        if (!failed) {
          this.productForm.controls.category.setValue(this.categories[0]?.id ?? 0);
        } else {
          toast.warning('Some reference data failed to load.');
        }
      }
    };

    this.inventoryService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.results;
        finish();
      },
      error: () => {
        failed = true;
        finish();
      },
    });

    this.inventoryService.getWarehouses().subscribe({
      next: (response) => {
        this.warehouses = response.results;
        finish();
      },
      error: () => {
        failed = true;
        finish();
      },
    });

    this.inventoryService.getProducts(this.searchTerm).subscribe({
      next: (response) => {
        this.products = response.results;
        finish();
      },
      error: () => {
        failed = true;
        finish();
      },
    });

    this.inventoryService.getStockLevels(this.showLowStockOnly).subscribe({
      next: (response) => {
        this.stockLevels = response.results;
        finish();
      },
      error: () => {
        failed = true;
        finish();
      },
    });

    this.inventoryService.getMovements().subscribe({
      next: (response) => {
        this.movements = response.results;
        finish();
      },
      error: () => {
        failed = true;
        finish();
      },
    });
  }

  searchProducts(): void {
    this.inventoryService.getProducts(this.searchTerm).subscribe({
      next: (response) => {
        this.products = response.results;
      },
      error: () => {
        toast.error('Could not search products.');
      },
    });
  }

  toggleLowStock(): void {
    this.showLowStockOnly = !this.showLowStockOnly;

    this.inventoryService.getStockLevels(this.showLowStockOnly).subscribe({
      next: (response) => {
        this.stockLevels = response.results;
      },
      error: () => {
        toast.error('Could not load stock levels.');
      },
    });
  }

  createCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      toast.warning('Please fill out all required category fields.');
      return;
    }

    this.submitting = true;

    this.inventoryService
      .createCategory(this.categoryForm.getRawValue())
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (category) => {
          this.categories = [...this.categories, category];
          this.categoryForm.reset({
            name: '',
            description: '',
          });
          toast.success('Category created successfully.');
        },
        error: (error) => this.handleError(error),
      });
  }

  createWarehouse(): void {
    if (this.warehouseForm.invalid) {
      this.warehouseForm.markAllAsTouched();
      toast.warning('Please fill out all required warehouse fields.');
      return;
    }

    this.submitting = true;

    this.inventoryService
      .createWarehouse({
        ...this.warehouseForm.getRawValue(),
        is_active: true,
      })
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (warehouse) => {
          this.warehouses = [...this.warehouses, warehouse];
          this.warehouseForm.reset({
            code: '',
            name: '',
            location: '',
          });
          toast.success('Warehouse created successfully.');
        },
        error: (error) => this.handleError(error),
      });
  }

  createProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      toast.warning('Please fill out all required product fields.');
      return;
    }

    this.submitting = true;

    const payload = this.productForm.getRawValue();

    this.inventoryService
      .createProduct({
        ...payload,
        unit_price: payload.unit_price,
        is_active: true,
      })
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (product) => {
          this.products = [product, ...this.products];
          this.productForm.reset({
            sku: '',
            name: '',
            description: '',
            category: this.categories[0]?.id ?? 0,
            unit_price: '0.00',
            reorder_level: 10,
          });
          toast.success('Product created successfully.');
          this.refreshSummary();
        },
        error: (error) => this.handleError(error),
      });
  }

  adjustStock(): void {
    if (this.adjustmentForm.invalid) {
      this.adjustmentForm.markAllAsTouched();
      toast.warning('Please fill out all required adjustment fields.');
      return;
    }

    this.submitting = true;

    this.inventoryService
      .adjustStock(this.adjustmentForm.getRawValue())
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          toast.success('Stock adjustment completed.');
          this.adjustmentForm.reset({
            product: 0,
            warehouse: 0,
            direction: 'IN',
            quantity: 1,
            reference: '',
            notes: '',
          });
          this.refreshInventoryData();
        },
        error: (error) => this.handleError(error),
      });
  }

  transferStock(): void {
    if (this.transferForm.invalid) {
      this.transferForm.markAllAsTouched();
      toast.warning('Please fill out all required transfer fields.');
      return;
    }

    const payload = this.transferForm.getRawValue();

    if (payload.source_warehouse === payload.destination_warehouse) {
      toast.error('Choose two different warehouses for transfer.');
      return;
    }

    this.submitting = true;

    this.inventoryService
      .transferStock(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          toast.success('Stock transfer completed.');
          this.transferForm.reset({
            product: 0,
            source_warehouse: 0,
            destination_warehouse: 0,
            quantity: 1,
            reference: '',
            notes: '',
          });
          this.refreshInventoryData();
        },
        error: (error) => this.handleError(error),
      });
  }

  private refreshSummary(): void {
    this.inventoryService.getSummary().subscribe({
      next: (summary) => (this.summary = summary),
    });
  }

  private refreshInventoryData(): void {
    this.refreshSummary();

    this.inventoryService.getStockLevels(this.showLowStockOnly).subscribe({
      next: (response) => (this.stockLevels = response.results),
    });

    this.inventoryService.getMovements().subscribe({
      next: (response) => (this.movements = response.results),
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
