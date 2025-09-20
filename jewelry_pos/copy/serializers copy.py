# inventory/serializers.py
from rest_framework import serializers
from .models import JewelryItem, Customer, Transaction, Sale
# from .communications import send_receipt_notification # <-- Add this import

class JewelryItemSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(max_length=None, use_url=True, allow_null=True, required=False)

    class Meta:
        model = JewelryItem
        fields = '__all__' # This means we want to include all fields from our model

# class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class SaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sale
        fields = ['jewelry_item', 'quantity', 'price_at_sale']

# class TransactionSerializer(serializers.ModelSerializer):
#     sales = SaleSerializer(many=True, write_only=True)

#     class Meta:
#         model = Transaction
#         fields = ['id', 'customer', 'transaction_date', 'total_amount', 'sales']

#     def create(self, validated_data):
#         sales_data = validated_data.pop('sales')
#         transaction = Transaction.objects.create(**validated_data)
#         total_amount = 0

#         for sale_data in sales_data:
#             # Mark the jewelry item as SOLD
#             item = sale_data['jewelry_item']
#             item.stock_status = 'SOLD'
#             item.save()

#             # Create the sale record
#             Sale.objects.create(transaction=transaction, **sale_data)
#             total_amount += sale_data['price_at_sale']

#         # Update transaction total
#         transaction.total_amount = total_amount
#         transaction.save()
#         return transaction

# class TransactionSerializer(serializers.ModelSerializer):
#     sales = SaleSerializer(many=True, write_only=True)
#     # We'll accept customer details directly instead of just an ID
#     customer_name = serializers.CharField(write_only=True)
#     customer_phone = serializers.CharField(write_only=True)
#     send_receipt = serializers.BooleanField(write_only=True, required=False) # <-- Add this


#     class Meta:
#         model = Transaction
#         # We don't need 'customer' here anymore since we handle it manually
#         fields = ['id', 'transaction_date', 'total_amount', 'sales', 'customer_name', 'customer_phone']
#         read_only_fields = ['total_amount', 'transaction_date', 'id'] # Fields calculated on the server

#     def create(self, validated_data):
#         # Pop the custom fields we added
#         customer_name = validated_data.pop('customer_name')
#         customer_phone = validated_data.pop('customer_phone')
#         sales_data = validated_data.pop('sales')

#         # --- This is the key logic: Get an existing customer or create a new one ---
#         customer, created = Customer.objects.get_or_create(
#             phone_number=customer_phone,
#             defaults={'name': customer_name}
#         )

#         # Create the transaction linked to the found or new customer
#         transaction = Transaction.objects.create(customer=customer, **validated_data)
        
#         total_amount = 0
#         for sale_data in sales_data:
#             item = sale_data['jewelry_item']
#             item.stock_status = 'SOLD'
#             item.save()
            
#             Sale.objects.create(transaction=transaction, **sale_data)
#             total_amount += sale_data['price_at_sale']

#         transaction.total_amount = total_amount
#         transaction.save()
#         return transaction
    

class TransactionSerializer(serializers.ModelSerializer):
    sales = SaleSerializer(many=True, write_only=True)
    customer_name = serializers.CharField(write_only=True)
    customer_phone = serializers.CharField(write_only=True)
    # --- NEW: GST fields from frontend ---
    cgst_percent = serializers.DecimalField(max_digits=5, decimal_places=2, write_only=True)
    sgst_percent = serializers.DecimalField(max_digits=5, decimal_places=2, write_only=True)
    send_receipt = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = Transaction
        fields = [
            'id', 'bill_number', 'customer', 'transaction_date', 'sub_total',
            'cgst_amount', 'sgst_amount', 'grand_total', 'payment_method',
            'sales', 'customer_name', 'customer_phone', 'cgst_percent', 'sgst_percent','send_receipt'
        ]
        read_only_fields = ['bill_number', 'customer', 'transaction_date', 'sub_total', 'cgst_amount', 'sgst_amount', 'grand_total']

    def create(self, validated_data):
        send_receipt = validated_data.pop('send_receipt', False)
        customer_name = validated_data.pop('customer_name')
        customer_phone = validated_data.pop('customer_phone')
        sales_data = validated_data.pop('sales')
        cgst_percent = validated_data.pop('cgst_percent')
        sgst_percent = validated_data.pop('sgst_percent')
        payment_method = validated_data.get('payment_method')

        customer, _ = Customer.objects.get_or_create(
            phone_number=customer_phone, defaults={'name': customer_name}
        )

        sub_total = sum(sale['price_at_sale'] for sale in sales_data)
        cgst_amount = sub_total * (cgst_percent / 100)
        sgst_amount = sub_total * (sgst_percent / 100)
        grand_total = sub_total + cgst_amount + sgst_amount

        transaction = Transaction.objects.create(
            customer=customer,
            sub_total=sub_total,
            cgst_amount=cgst_amount,
            sgst_amount=sgst_amount,
            grand_total=grand_total,
            payment_method=payment_method
        )
        
        for sale_data in sales_data:
            item = sale_data['jewelry_item']
            item.stock_status = 'SOLD'
            item.save()
            Sale.objects.create(transaction=transaction, **sale_data)
        
        if send_receipt and transaction.customer.phone_number:
            send_receipt_notification(transaction)
            
        return transaction
    
# This serializer includes the customer's name for the list view
class TransactionListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'bill_number', 'customer_name', 'transaction_date', 'grand_total']