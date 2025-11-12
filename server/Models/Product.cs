using MongoDB.Bson.Serialization.Attributes;

namespace server.Models;

public class Product
{
    [BsonId]
    // product identifier for Mongo
    public Guid Id { get; set; } = Guid.NewGuid();
    // display name shown in ui
    public string Name { get; set; } = string.Empty;
    // stock keeping unit for uniqueness
    public string Sku { get; set; } = string.Empty;
    // category reference id
    public Guid CategoryId { get; set; }
    // navigation to category document
    public Category? Category { get; set; }
    // supplier reference id when sourced externally
    public Guid? SupplierId { get; set; }
    // navigation to supplier document
    public Supplier? Supplier { get; set; }
    // on hand quantity
    public int Quantity { get; set; }
    // threshold to flag reorders
    public int ReorderLevel { get; set; }
    // selling or purchase price per unit
    public decimal UnitPrice { get; set; }
    // created timestamp for auditing
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
