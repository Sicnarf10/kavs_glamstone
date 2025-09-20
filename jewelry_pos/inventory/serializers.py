# inventory/serializers.py
from rest_framework import serializers
from .models import JewelryItem, Customer, Transaction, Sale

# Converts JewelryItem model instances to JSON and validates incoming data.
class JewelryItemSerializer(serializers.ModelSerializer):
    # Defines the image field, making it optional and ensuring it returns a full URL.
    image = serializers.ImageField(max_length=None, use_url=True, allow_null=True, required=False)
    class Meta:
        model = JewelryItem
        fields = '__all__'

# Converts Customer model instances to JSON and validates incoming data.
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

# Converts Sale model instances to JSON, used when creating a transaction.
class SaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sale
        fields = ['jewelry_item', 'quantity', 'price_at_sale']

# Handles the creation of a new Transaction, including all calculations.
class TransactionSerializer(serializers.ModelSerializer):
    # These fields are received from the frontend but not saved directly to the model.
    sales = SaleSerializer(many=True, write_only=True)
    customer_name = serializers.CharField(write_only=True)
    customer_phone = serializers.CharField(write_only=True)
    cgst_percent = serializers.DecimalField(max_digits=5, decimal_places=2, write_only=True)
    sgst_percent = serializers.DecimalField(max_digits=5, decimal_places=2, write_only=True)
    send_receipt = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = Transaction
        # Lists all the fields that this serializer will handle.
        fields = [
            'id', 'bill_number', 'customer', 'transaction_date', 'sub_total',
            'cgst_amount', 'sgst_amount', 'grand_total', 'payment_method',
            'sales', 'customer_name', 'customer_phone', 'cgst_percent', 'sgst_percent', 'send_receipt'
        ]
        # Specifies fields that are calculated by the server and should not be provided by the client.
        read_only_fields = ['bill_number', 'customer', 'transaction_date', 'sub_total', 'cgst_amount', 'sgst_amount', 'grand_total']

    # This method contains the logic for what happens when a new transaction is created.
    def create(self, validated_data):
        # We don't use send_receipt here because the manual WhatsApp flow is on the frontend.
        validated_data.pop('send_receipt', False) 
        customer_name = validated_data.pop('customer_name')
        customer_phone = validated_data.pop('customer_phone')
        sales_data = validated_data.pop('sales')
        cgst_percent = validated_data.pop('cgst_percent')
        sgst_percent = validated_data.pop('sgst_percent')
        payment_method = validated_data.get('payment_method')

        # Finds an existing customer by phone number or creates a new one.
        customer, _ = Customer.objects.get_or_create(phone_number=customer_phone, defaults={'name': customer_name})

        # Calculates all the final amounts for the bill.
        sub_total = sum(sale['price_at_sale'] for sale in sales_data)
        cgst_amount = sub_total * (cgst_percent / 100)
        sgst_amount = sub_total * (sgst_percent / 100)
        grand_total = sub_total + cgst_amount + sgst_amount

        # Creates the main Transaction record in the database.
        transaction = Transaction.objects.create(
            customer=customer, sub_total=sub_total, cgst_amount=cgst_amount,
            sgst_amount=sgst_amount, grand_total=grand_total, payment_method=payment_method
        )
        
        # Creates a Sale record for each item in the cart and marks the item as 'SOLD'.
        for sale_data in sales_data:
            item = sale_data['jewelry_item']
            item.stock_status = 'SOLD'
            item.save()
            Sale.objects.create(transaction=transaction, **sale_data)
            
        return transaction

# A simple serializer for displaying a list of transactions.
class TransactionListSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    class Meta:
        model = Transaction
        fields = ['id', 'bill_number', 'customer_name', 'transaction_date', 'grand_total']

# A detailed serializer for a single receipt view, including nested sale and customer data.
class DetailedSaleSerializer(serializers.ModelSerializer):
    jewelry_item_name = serializers.CharField(source='jewelry_item.name', read_only=True)
    class Meta:
        model = Sale
        fields = ['id', 'jewelry_item_name', 'quantity', 'price_at_sale']

class TransactionDetailSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer()
    sales = DetailedSaleSerializer(many=True)
    class Meta:
        model = Transaction
        fields = '__all__'