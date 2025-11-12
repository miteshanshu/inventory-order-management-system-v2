using server.Models;

namespace server.DTOs;

// payload for each item when creating an order
public record OrderItemRequest(Guid ProductId, int Quantity, decimal UnitPrice);

// request body for creating purchase or sales orders
public record OrderCreateDto(OrderType Type, Guid? SupplierId, string? CustomerName, List<OrderItemRequest> Items);

// response shape returned to clients after order queries
public record OrderResponseDto(Guid Id, string OrderNumber, DateTime OrderDate, OrderType Type, Guid? SupplierId, string? SupplierName, string? CustomerName, decimal TotalAmount, IEnumerable<OrderItemResponse> Items);

// line item detail returned in order responses
public record OrderItemResponse(Guid Id, Guid ProductId, string ProductName, int Quantity, decimal UnitPrice, decimal LineTotal);
