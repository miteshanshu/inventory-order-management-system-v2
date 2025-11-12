using BCrypt.Net;
using MongoDB.Driver;
using server.Models;

namespace server.Data;

public static class SeedData
{
    public static async Task InitializeAsync(MongoDbContext context)
    {
        // seed categories when database starts empty
        var categoriesCount = await context.Categories.CountDocumentsAsync(_ => true);
        if (categoriesCount == 0)
        {
            var categories = new List<Category>
            {
                new() { Name = "Stationery", Description = "Office supplies" },
                new() { Name = "Electronics", Description = "Devices" },
                new() { Name = "Furniture", Description = "Office furniture" }
            };
            await context.Categories.InsertManyAsync(categories);
        }

        // fill default suppliers so products can reference them
        var suppliersCount = await context.Suppliers.CountDocumentsAsync(_ => true);
        if (suppliersCount == 0)
        {
            var suppliers = new List<Supplier>
            {
                new() { Name = "Acme Supplies", ContactEmail = "sales@acme.com", Phone = "1234567890", Address = "12 Industrial Way" },
                new() { Name = "TechSource", ContactEmail = "support@techsource.com", Phone = "9876543210", Address = "42 Silicon Ave" }
            };
            await context.Suppliers.InsertManyAsync(suppliers);
        }

        // add sample products tied to seeded categories and suppliers
        var productsCount = await context.Products.CountDocumentsAsync(_ => true);
        if (productsCount == 0)
        {
            var firstCategory = await context.Categories.Find(_ => true).FirstOrDefaultAsync();
            var firstSupplier = await context.Suppliers.Find(_ => true).FirstOrDefaultAsync();
            var furnitureCategory = await context.Categories.Find(c => c.Name == "Furniture").FirstOrDefaultAsync();
            var electronicsCategory = await context.Categories.Find(c => c.Name == "Electronics").FirstOrDefaultAsync();

            if (firstCategory != null && firstSupplier != null && furnitureCategory != null && electronicsCategory != null)
            {
                var products = new List<Product>
                {
                    new() { Name = "Printer Paper", Sku = "PRP-001", CategoryId = firstCategory.Id, SupplierId = firstSupplier.Id, Quantity = 120, ReorderLevel = 30, UnitPrice = 4.5m },
                    new() { Name = "Office Chair", Sku = "OFF-CHA", CategoryId = furnitureCategory.Id, Quantity = 25, ReorderLevel = 5, UnitPrice = 85m },
                    new() { Name = "Wireless Mouse", Sku = "TEC-MSE", CategoryId = electronicsCategory.Id, SupplierId = firstSupplier.Id, Quantity = 60, ReorderLevel = 10, UnitPrice = 25m }
                };
                await context.Products.InsertManyAsync(products);
            }
        }

        // seed admin and staff accounts for initial login
        var usersCount = await context.Users.CountDocumentsAsync(_ => true);
        if (usersCount == 0)
        {
            var users = new List<User>
            {
                new() { Username = "admin", Email = "admin@inventory.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"), Role = "Admin" },
                new() { Username = "staff", Email = "staff@inventory.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Staff@123"), Role = "Staff" }
            };
            await context.Users.InsertManyAsync(users);
        }

        // seed one purchase order so reporting has data
        var ordersCount = await context.Orders.CountDocumentsAsync(_ => true);
        if (ordersCount == 0)
        {
            var product = await context.Products.Find(_ => true).FirstOrDefaultAsync();
            var supplier = await context.Suppliers.Find(_ => true).FirstOrDefaultAsync();

            if (product != null && supplier != null)
            {
                var order = new Order
                {
                    OrderNumber = "PO-1001",
                    Type = OrderType.Purchase,
                    SupplierId = supplier.Id,
                    OrderDate = DateTime.UtcNow.Date.AddDays(-7),
                    TotalAmount = 540m,
                    Items = new List<OrderItem>
                    {
                        new() { ProductId = product.Id, Quantity = 120, UnitPrice = 4.5m }
                    }
                };
                await context.Orders.InsertOneAsync(order);
            }
        }
    }
}
