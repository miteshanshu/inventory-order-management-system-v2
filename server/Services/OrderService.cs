using MongoDB.Driver;
using server.Data;
using server.DTOs;
using server.Helpers;
using server.Models;

namespace server.Services;

/// <summary>
/// Order service - handles purchase orders and sales orders with inventory management
/// Updates product quantities when orders are created or deleted
/// </summary>
public class OrderService
{
    private readonly MongoDbContext _context;

    public OrderService(MongoDbContext context)
    {
        // keep context so we can query collections
        _context = context;
    }

    /// <summary>
    /// Get all orders sorted by date (newest first)
    /// </summary>
    public async Task<ResponseWrapper<IEnumerable<OrderResponseDto>>> GetAllAsync()
    {
        // Fetch all orders and sort by date descending
        var orders = await _context.Orders.Find(_ => true).SortByDescending(x => x.OrderDate).ToListAsync();
        
        // Map each order to response DTO with supplier and item details
        var response = new List<OrderResponseDto>();
        foreach (var order in orders)
        {
            var supplier = order.SupplierId.HasValue 
                ? await _context.Suppliers.Find(s => s.Id == order.SupplierId).FirstOrDefaultAsync() 
                : null;
            response.Add(await MapOrderAsync(order, supplier));
        }
        
        return ResponseWrapper<IEnumerable<OrderResponseDto>>.Ok(response);
    }

    /// <summary>
    /// Get a single order by ID with all details
    /// </summary>
    public async Task<ResponseWrapper<OrderResponseDto>> GetByIdAsync(Guid id)
    {
        var order = await _context.Orders.Find(x => x.Id == id).FirstOrDefaultAsync();
        if (order == null)
        {
            return ResponseWrapper<OrderResponseDto>.Fail("Order not found");
        }
        
        // Get supplier details if order has one
        var supplier = order.SupplierId.HasValue 
            ? await _context.Suppliers.Find(s => s.Id == order.SupplierId).FirstOrDefaultAsync() 
            : null;
        return ResponseWrapper<OrderResponseDto>.Ok(await MapOrderAsync(order, supplier));
    }

    /// <summary>
    /// Create a new order (purchase or sales)
    /// Automatically updates product quantities based on order type
    /// </summary>
    public async Task<ResponseWrapper<OrderResponseDto>> CreateAsync(OrderCreateDto request)
    {
        // Validate that order has at least one item
        if (!request.Items.Any())
        {
            return ResponseWrapper<OrderResponseDto>.Fail("Order requires at least one item");
        }

        // Verify all products exist
        var productIds = request.Items.Select(x => x.ProductId).ToList();
        var productFilter = Builders<Product>.Filter.In(p => p.Id, productIds);
        // fetch all referenced products in one query
        var products = await _context.Products.Find(productFilter).ToListAsync();
        
        if (products.Count != productIds.Count)
        {
            return ResponseWrapper<OrderResponseDto>.Fail("One or more products not found");
        }

        // For sales orders, verify stock is available
        if (request.Type == OrderType.Sales)
        {
            foreach (var item in request.Items)
            {
                var product = products.First(x => x.Id == item.ProductId);
                if (product.Quantity < item.Quantity)
                {
                    return ResponseWrapper<OrderResponseDto>.Fail($"Insufficient stock for {product.Name}");
                }
            }
        }

        // Create order with unique order number
        var order = new Order
        {
            OrderNumber = GenerateOrderNumber(request.Type),
            OrderDate = DateTime.UtcNow,
            Type = request.Type,
            SupplierId = request.SupplierId,
            CustomerName = request.CustomerName,
            // convert request items into entity objects
            Items = request.Items.Select(x => new OrderItem
            {
                ProductId = x.ProductId,
                Quantity = x.Quantity,
                UnitPrice = x.UnitPrice
            }).ToList()
        };

        // Calculate total amount for the order
        order.TotalAmount = order.Items.Sum(x => x.Quantity * x.UnitPrice);

        // Update product quantities: add for purchases, subtract for sales
        foreach (var item in order.Items)
        {
            var product = products.First(x => x.Id == item.ProductId);
            // add stock for purchases, subtract for sales
            var quantityChange = order.Type == OrderType.Purchase ? item.Quantity : -item.Quantity;
            
            var update = Builders<Product>.Update.Inc(p => p.Quantity, quantityChange);
            await _context.Products.UpdateOneAsync(p => p.Id == product.Id, update);
        }

        // Save order to database
        await _context.Orders.InsertOneAsync(order);
        return await GetByIdAsync(order.Id);
    }

    /// <summary>
    /// Delete an order and reverse inventory changes
    /// </summary>
    public async Task<ResponseWrapper<bool>> DeleteAsync(Guid id)
    {
        // Find order to delete
        var order = await _context.Orders.Find(x => x.Id == id).FirstOrDefaultAsync();
        if (order == null)
        {
            return ResponseWrapper<bool>.Fail("Order not found");
        }

        // Reverse inventory quantity changes - opposite of creation
        foreach (var item in order.Items)
        {
            var product = await _context.Products.Find(x => x.Id == item.ProductId).FirstOrDefaultAsync();
            if (product == null)
            {
                // old product removed, nothing to adjust
                continue;
            }
            
            // Reverse the quantity change: subtract for purchases, add for sales
            var quantityChange = order.Type == OrderType.Purchase ? -item.Quantity : item.Quantity;
            var update = Builders<Product>.Update.Inc(p => p.Quantity, quantityChange);
            await _context.Products.UpdateOneAsync(p => p.Id == product.Id, update);
        }

        // Delete the order
        await _context.Orders.DeleteOneAsync(x => x.Id == id);
        return ResponseWrapper<bool>.Ok(true);
    }

    /// <summary>
    /// Helper method to map Order entity to OrderResponseDto
    /// Includes all related product and supplier information
    /// </summary>
    private async Task<OrderResponseDto> MapOrderAsync(Order order, Supplier? supplier)
    {
        // Build list of order items with product details
        var items = new List<OrderItemResponse>();
        foreach (var item in order.Items)
        {
            var product = await _context.Products.Find(p => p.Id == item.ProductId).FirstOrDefaultAsync();
            // build line response with product name and computed total
            items.Add(new OrderItemResponse(
                item.Id,
                item.ProductId,
                product?.Name ?? string.Empty,
                item.Quantity,
                item.UnitPrice,
                item.Quantity * item.UnitPrice
            ));
        }
        
        // Return complete order DTO
        return new OrderResponseDto(
            order.Id,
            order.OrderNumber,
            order.OrderDate,
            order.Type,
            order.SupplierId,
            supplier?.Name,
            order.CustomerName,
            order.TotalAmount,
            items
        );
    }

    /// <summary>
    /// Generate unique order number based on type and timestamp
    /// Format: PO-[timestamp] for Purchase Orders, SO-[timestamp] for Sales Orders
    /// </summary>
    private static string GenerateOrderNumber(OrderType type)
    {
        var prefix = type == OrderType.Purchase ? "PO" : "SO";
        // timestamp keeps order numbers unique and sortable
        return $"{prefix}-{DateTime.UtcNow:yyyyMMddHHmmss}";
    }
}
