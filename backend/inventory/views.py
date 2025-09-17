from django.shortcuts import render

# Create your views here.
# inventory/views.py
from datetime import datetime
from django.db.models import Count, Sum
import barcode
from barcode.writer import ImageWriter
from django.http import HttpResponse
from io import BytesIO
import zipfile 
from django.utils import timezone
from django.db.models import Sum, Count
from datetime import timedelta
from rest_framework.views import APIView # Make sure to import this
from rest_framework.response import Response # And this
from rest_framework import generics, status
from .models import JewelryItem, Customer, Transaction, Sale # <-- Add Sale here
from .serializers import JewelryItemSerializer, CustomerSerializer, TransactionSerializer


# This view will handle creating new items and listing all items
# class JewelryItemListCreateView(generics.ListCreateAPIView):
#     queryset = JewelryItem.objects.all()
#     serializer_class = JewelryItemSerializer

class JewelryItemListView(generics.ListAPIView):
    queryset = JewelryItem.objects.all().order_by('-added_date')
    serializer_class = JewelryItemSerializer


# class JewelryItemCreateBulkView(APIView):
#     def post(self, request, *args, **kwargs):
#         # We'll get quantity from the form, defaulting to 1
#         quantity = int(request.data.get('quantity', 1))

#         # Prepare data, removing quantity as it's not a model field
#         item_data = request.data.copy()
#         item_data.pop('quantity', None)

#         created_items = []
#         # Loop 'quantity' times to create multiple items
#         for _ in range(quantity):
#             serializer = JewelryItemSerializer(data=item_data)
#             if serializer.is_valid():
#                 # The save() method on our model will auto-generate the unique item_id
#                 serializer.save()
#                 created_items.append(serializer.data)
#             else:
#                 return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#         return Response(created_items, status=status.HTTP_201_CREATED)


# class JewelryItemCreateBulkView(APIView):
#     def post(self, request, *args, **kwargs):
#         # We'll get quantity from the form, defaulting to 1
#         quantity = int(request.data.get('quantity', 1))

#         # Prepare data, removing quantity as it's not a model field
#         item_data = request.data.copy()
#         item_data.pop('quantity', None)

#         created_items = []
#         # Loop 'quantity' times to create multiple items
#         for _ in range(quantity):
#             serializer = JewelryItemSerializer(data=item_data)
#             if serializer.is_valid():
#                 # The save() method on our model will auto-generate the unique item_id
#                 serializer.save()
#                 created_items.append(serializer.data)
#             else:
#                 return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#         return Response(created_items, status=status.HTTP_201_CREATED)

# class JewelryItemCreateBulkView(APIView):
#     def post(self, request, *args, **kwargs):
#         quantity = int(request.data.get('quantity', 1))

#         item_data = request.data.copy()
#         item_data.pop('quantity', None)
#         item_data.pop('profit_margin', None)

#         # Get the image file from the request just once
#         image_file = request.FILES.get('image')

#         # We validate the data once before starting the loop.
#         serializer_check = JewelryItemSerializer(data=item_data)
#         if not serializer_check.is_valid():
#             return Response(serializer_check.errors, status=status.HTTP_400_BAD_REQUEST)

#         created_items = []
#         for _ in range(quantity):
#             # --- THIS IS THE CRITICAL FIX ---
#             if image_file:
#                 # Rewind the file stream to the beginning for each loop iteration
#                 image_file.seek(0)

#             # Now, create the serializer instance and save
#             serializer = JewelryItemSerializer(data=item_data)
#             serializer.is_valid(raise_exception=True)
#             serializer.save()
#             created_items.append(serializer.data)

#         return Response(created_items, status=status.HTTP_201_CREATED)

# class JewelryItemCreateBulkView(APIView):
#     def post(self, request, *args, **kwargs):
#         quantity = int(request.data.get('quantity', 1))
        
#         item_data = request.data.copy()
#         item_data.pop('quantity', None)
#         item_data.pop('profit_margin', None)

#         created_items = []
#         first_item_instance = None

#         # Loop 'quantity' times
#         for i in range(quantity):
#             # For the first item, we process the data as normal, including the uploaded image
#             if i == 0:
#                 serializer = JewelryItemSerializer(data=item_data)
#                 if serializer.is_valid():
#                     # Save the first item, which also saves the image to the media folder
#                     first_item_instance = serializer.save()
#                     created_items.append(serializer.data)
#                 else:
#                     # If the first item fails, the whole request is bad
#                     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
#             # For all subsequent items (2nd, 3rd, etc.)
#             else:
#                 # We reuse the validated data from the first item
#                 # but remove the 'image' file upload to avoid stream errors.
#                 subsequent_data = serializer.validated_data
                
#                 # --- THIS IS THE KEY ---
#                 # We create a new instance but manually set the image path
#                 # to be the same as the first item's saved image path.
#                 new_instance = JewelryItem(**subsequent_data)
#                 new_instance.image = first_item_instance.image 
#                 new_instance.save() # This save() will trigger the auto-ID generation
                
#                 # We re-serialize the new instance to get its final data (like its new ID)
#                 result_data = JewelryItemSerializer(new_instance).data
#                 created_items.append(result_data)

#         return Response(created_items, status=status.HTTP_201_CREATED)


class JewelryItemCreateBulkView(APIView):
    def post(self, request, *args, **kwargs):
        quantity = int(request.data.get('quantity', 1))

        # Prepare a clean data dictionary for the serializer.
        item_data = request.data.copy()
        item_data.pop('quantity', None)
        item_data.pop('profit_margin', None)

        # 1. Validate the data and create the FIRST item
        serializer = JewelryItemSerializer(data=item_data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Save the first item. This also saves the image file to disk.
        first_item = serializer.save()
        created_items = [serializer.data]

        # 2. If quantity > 1, create the rest of the items as copies
        if quantity > 1:
            # Prepare a data dictionary for the clones from the successfully validated data.
            # We don't include the image file itself, as it's already saved.
            data_for_clones = serializer.validated_data
            data_for_clones.pop('image', None)

            for _ in range(quantity - 1):
                # Create a new model instance with the same data
                new_item = JewelryItem(**data_for_clones)

                # --- THIS IS THE KEY ---
                # Assign the already-saved image from the first item to the new item.
                new_item.image = first_item.image

                # Save the new item. Our model's save() method will generate a new unique ID.
                new_item.save()

                # Add the new item's data to our results list
                created_items.append(JewelryItemSerializer(new_item).data)

        return Response(created_items, status=status.HTTP_201_CREATED)


class CustomerListCreateView(generics.ListCreateAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

class TransactionCreateView(generics.CreateAPIView):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer


# class DashboardMetricsView(APIView):
#     def get(self, request, *args, **kwargs):
#         # Calculate metrics for the last 30 days
#         thirty_days_ago = timezone.now() - timedelta(days=30)
#         recent_transactions = Transaction.objects.filter(transaction_date__gte=thirty_days_ago)

#         # Total Revenue (Last 30 days)
#         total_revenue = recent_transactions.aggregate(total=Sum('total_amount'))['total'] or 0

#         # Total Sales/Transactions (Last 30 days)
#         total_sales = recent_transactions.count()

#         # Top 5 Selling Items (by quantity sold in the last 30 days)
#         top_selling_items = Sale.objects.filter(transaction__in=recent_transactions)\
#             .values('jewelry_item__name')\
#             .annotate(count=Count('id'))\
#             .order_by('-count')[:5]

#         # Top 5 Selling Categories
#         top_selling_categories = Sale.objects.filter(transaction__in=recent_transactions)\
#             .values('jewelry_item__category')\
#             .annotate(count=Count('id'))\
#             .order_by('-count')[:5]

#         metrics = {
#             'total_revenue': f'{total_revenue:,.2f}',
#             'total_sales': total_sales,
#             'top_selling_items': list(top_selling_items),
#             'top_selling_categories': list(top_selling_categories)
#         }
#         return Response(metrics)


class DashboardMetricsView(APIView):
    def get(self, request, *args, **kwargs):
        # Get date range from query params, or default to last 30 days
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            transactions = Transaction.objects.filter(transaction_date__date__range=[start_date, end_date])
        else:
            # Default to all-time if no dates are provided
            transactions = Transaction.objects.all()

        total_revenue = transactions.aggregate(total=Sum('total_amount'))['total'] or 0
        total_sales = transactions.count()
        
        top_selling_items = Sale.objects.filter(transaction__in=transactions)\
            .values('jewelry_item__name')\
            .annotate(count=Count('id'))\
            .order_by('-count')[:5]
        
        top_selling_categories = Sale.objects.filter(transaction__in=transactions)\
            .values('jewelry_item__category')\
            .annotate(count=Count('id'))\
            .order_by('-count')[:5]

        metrics = { # ... (rest of the metrics dictionary is the same)
            'total_revenue': f'{total_revenue:,.2f}',
            'total_sales': total_sales,
            'top_selling_items': list(top_selling_items),
            'top_selling_categories': list(top_selling_categories)
        }
        return Response(metrics)

# --- NEW VIEW for the inventory report ---
class InventoryReportView(APIView):
    def get(self, request, *args, **kwargs):
        # Get counts of items currently in stock, grouped by category and name
        stock_report = JewelryItem.objects.filter(stock_status='IN_STOCK')\
            .values('category', 'name', 'style', 'material')\
            .annotate(count=Count('id'))\
            .order_by('category', 'name')
        
        return Response(stock_report)

# This view retrieves the details of a single JewelryItem by its ID (pk)
class JewelryItemDetailView(generics.RetrieveAPIView):
    queryset = JewelryItem.objects.all()
    serializer_class = JewelryItemSerializer

# This view is for barcode
def generate_barcode_view(request, item_id):
    # We'll use the Code 128 format, which is common and versatile
    code128 = barcode.get_barcode_class('code128')
    
    # Generate the barcode instance with the item_id and an ImageWriter
    # The writer_options add human-readable text below the barcode
    writer_options = {"write_text": True, "font_size": 10}
    barcode_instance = code128(item_id, writer=ImageWriter())
    
    # Create an in-memory binary stream to save the image
    buffer = BytesIO()
    barcode_instance.write(buffer, options=writer_options)
    
    # Return the image as an HTTP response
    buffer.seek(0)
    return HttpResponse(buffer, content_type='image/png')


# --- This is for bulk barcode export ---
class BulkBarcodeExportView(APIView):
    def post(self, request, *args, **kwargs):
        item_ids = request.data.get('item_ids', [])

        if not item_ids:
            return Response({"error": "No item IDs provided"}, status=400)

        # Create an in-memory zip file
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, 'a', zipfile.ZIP_DEFLATED, False) as zip_file:
            for item_id in item_ids:
                # Generate the barcode for each item_id
                code128 = barcode.get_barcode_class('code128')
                writer_options = {"write_text": True, "font_size": 10}
                barcode_instance = code128(item_id, writer=ImageWriter())
                
                # Write the barcode image to its own in-memory buffer
                image_buffer = BytesIO()
                barcode_instance.write(image_buffer, options=writer_options)
                
                # Add the image from the buffer to the zip file
                # The filename inside the zip will be "{item_id}.png"
                zip_file.writestr(f'{item_id}.png', image_buffer.getvalue())

        # Prepare the response to be a file download
        response = HttpResponse(zip_buffer.getvalue(), content_type='application/zip')
        response['Content-Disposition'] = 'attachment; filename="barcodes.zip"'
        return response