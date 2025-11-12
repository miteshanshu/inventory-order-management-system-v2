using MongoDB.Bson.Serialization.Attributes;

namespace server.Models;

public class Order
{
    [BsonId]
    // unique id for order document
    public Guid Id { get; set; } = Guid.NewGuid();
    // human friendly order reference
    public string OrderNumber { get; set; } = string.Empty;
    // when the order was placed
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    // sales or purchase flag
    public OrderType Type { get; set; }
    // supplier reference for purchase orders
    public Guid? SupplierId { get; set; }
    // supplier document loaded when needed
    public Supplier? Supplier { get; set; }
    // customer name for sales orders
    public string? CustomerName { get; set; }
    // total value of order
    public decimal TotalAmount { get; set; }
    // collection of items linked to order
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}

public enum OrderType
{
    // outbound customer order
    Sales,
    // inbound purchase from supplier
    Purchase
}
