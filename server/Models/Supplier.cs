using MongoDB.Bson.Serialization.Attributes;

namespace server.Models;

public class Supplier
{
    [BsonId]
    // unique supplier id
    public Guid Id { get; set; } = Guid.NewGuid();
    // supplier company name
    public string Name { get; set; } = string.Empty;
    // main contact email we send orders to
    public string ContactEmail { get; set; } = string.Empty;
    // optional phone number for follow ups
    public string? Phone { get; set; }
    // optional address details
    public string? Address { get; set; }
    // products supplied by this vendor
    public ICollection<Product> Products { get; set; } = new List<Product>();
    // orders placed with this supplier
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
