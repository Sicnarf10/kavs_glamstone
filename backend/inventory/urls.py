# inventory/urls.py
from django.urls import path
from .views import (
    # We are now importing our new, specific views
    JewelryItemListView,
    JewelryItemCreateBulkView,
    CustomerListCreateView, 
    TransactionCreateView, 
    DashboardMetricsView,
    JewelryItemDetailView,
    generate_barcode_view,
    InventoryReportView,
    BulkBarcodeExportView
)

urlpatterns = [
    # This path now correctly uses the view that ONLY LISTS items (GET)
    path('api/items/', JewelryItemListView.as_view(), name='item-list'),
    
    # This path correctly uses the view that ONLY CREATES items (POST)
    path('api/items/create/', JewelryItemCreateBulkView.as_view(), name='item-create-bulk'),
    
    path('api/customers/', CustomerListCreateView.as_view(), name='customer-list-create'),
    path('api/transactions/', TransactionCreateView.as_view(), name='transaction-create'),
    path('api/metrics/', DashboardMetricsView.as_view(), name='dashboard-metrics'),
    # This path will handle requests like /api/items/5/
    path('api/items/<int:pk>/', JewelryItemDetailView.as_view(), name='item-detail'),
    path('api/barcode/<str:item_id>/', generate_barcode_view, name='generate-barcode'),
    path('api/barcodes/bulk-export/', BulkBarcodeExportView.as_view(), name='bulk-barcode-export'),
    path('api/inventory-report/', InventoryReportView.as_view(), name='inventory-report'),
]