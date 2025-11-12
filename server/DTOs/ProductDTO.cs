namespace server.DTOs;

// payload used when admin adds a product
public record ProductCreateDto(string Name, string Sku, Guid CategoryId, Guid? SupplierId, int Quantity, int ReorderLevel, decimal UnitPrice);

// payload used when editing product details
public record ProductUpdateDto(string Name, string Sku, Guid CategoryId, Guid? SupplierId, int Quantity, int ReorderLevel, decimal UnitPrice);

// data returned to clients for product listings
public record ProductResponseDto(Guid Id, string Name, string Sku, Guid CategoryId, string CategoryName, Guid? SupplierId, string? SupplierName, int Quantity, int ReorderLevel, decimal UnitPrice, DateTime CreatedAt);
