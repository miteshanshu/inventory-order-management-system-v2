using MongoDB.Bson.Serialization.Attributes;

namespace server.Models;

public class Category
{
    [BsonId]
    // primary key for Mongo documents
    public Guid Id { get; set; } = Guid.NewGuid();
    // category display name
    public string Name { get; set; } = string.Empty;
    // optional description shown to users
    public string? Description { get; set; }
    // navigation back to products in this category
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
