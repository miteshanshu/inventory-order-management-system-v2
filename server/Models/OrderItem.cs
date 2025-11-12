using MongoDB.Bson.Serialization.Attributes;

namespace server.Models;

public class OrderItem
{
    [BsonId]
    // unique id for this order line
    public Guid Id { get; set; } = Guid.NewGuid();
    // parent order reference
    public Guid OrderId { get; set; }
    // navigation to order document
    public Order? Order { get; set; }
    // product reference for the line
    public Guid ProductId { get; set; }
    // loaded product info when needed
    public Product? Product { get; set; }
    // quantity ordered
    public int Quantity { get; set; }
    // price per unit on this line
    public decimal UnitPrice { get; set; }
}
