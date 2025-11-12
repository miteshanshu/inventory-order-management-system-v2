using MongoDB.Driver;
using Microsoft.Extensions.Logging;
using server.Data;
using server.DTOs;
using server.Helpers;
using server.Models;

namespace server.Services;

/// <summary>
/// Product service - manages inventory products
/// Handles CRUD operations with validation and error handling
/// </summary>
public class ProductService
{
    private readonly MongoDbContext _context;
    private readonly ILogger<ProductService> _logger;

    public ProductService(MongoDbContext context, ILogger<ProductService> logger)
    {
        // store context and logger for later operations
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all products sorted by name
    /// </summary>
    public async Task<ResponseWrapper<IEnumerable<ProductResponseDto>>> GetAllAsync()
    {
        try
        {
            // load every product alphabetically
            var products = await _context.Products
                .Find(_ => true)
                .SortBy(p => p.Name)
                .ToListAsync()
                .ConfigureAwait(false);

            // Map to DTOs with category and supplier names
            var response = new List<ProductResponseDto>();
            foreach (var product in products)
            {
                var dto = await MapProductToDto(product).ConfigureAwait(false);
                response.Add(dto);
            }

            return ResponseWrapper<IEnumerable<ProductResponseDto>>.Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching products: {ex.Message}");
            return ResponseWrapper<IEnumerable<ProductResponseDto>>.Fail("Error fetching products");
        }
    }

    /// <summary>
    /// Get single product by ID
    /// </summary>
    public async Task<ResponseWrapper<ProductResponseDto>> GetByIdAsync(Guid id)
    {
        try
        {
            var product = await _context.Products
                .Find(p => p.Id == id)
                .FirstOrDefaultAsync()
                .ConfigureAwait(false);

            if (product == null)
            {
                return ResponseWrapper<ProductResponseDto>.Fail("Product not found");
            }

            var dto = await MapProductToDto(product).ConfigureAwait(false);
            return ResponseWrapper<ProductResponseDto>.Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching product {id}: {ex.Message}");
            return ResponseWrapper<ProductResponseDto>.Fail("Error fetching product");
        }
    }

    /// <summary>
    /// Create new product
    /// </summary>
    public async Task<ResponseWrapper<ProductResponseDto>> CreateAsync(ProductCreateDto request)
    {
        try
        {
            // Validate input
            if (request == null)
            {
                return ResponseWrapper<ProductResponseDto>.Fail("Invalid product data");
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return ResponseWrapper<ProductResponseDto>.Fail("Product name is required");
            }

            if (request.Quantity < 0 || request.UnitPrice < 0)
            {
                return ResponseWrapper<ProductResponseDto>.Fail("Quantity and price cannot be negative");
            }

            // Check if SKU already exists
            var existingSku = await _context.Products
                .Find(p => p.Sku == request.Sku)
                .AnyAsync()
                .ConfigureAwait(false);

            if (existingSku)
            {
                return ResponseWrapper<ProductResponseDto>.Fail("SKU already exists");
            }

            // Verify category exists
            var category = await _context.Categories
                .Find(c => c.Id == request.CategoryId)
                .FirstOrDefaultAsync()
                .ConfigureAwait(false);

            if (category == null)
            {
                return ResponseWrapper<ProductResponseDto>.Fail("Category not found");
            }

            // Verify supplier exists (if provided)
            if (request.SupplierId.HasValue)
            {
                var supplier = await _context.Suppliers
                    .Find(s => s.Id == request.SupplierId)
                    .FirstOrDefaultAsync()
                    .ConfigureAwait(false);

                if (supplier == null)
                {
                    return ResponseWrapper<ProductResponseDto>.Fail("Supplier not found");
                }
            }

            // Create product
            var product = new Product
            {
                Id = Guid.NewGuid(),
                Name = request.Name.Trim(),
                // keep SKU uppercase for comparisons
                Sku = request.Sku.Trim().ToUpper(),
                CategoryId = request.CategoryId,
                SupplierId = request.SupplierId,
                Quantity = request.Quantity,
                ReorderLevel = request.ReorderLevel,
                UnitPrice = request.UnitPrice,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Products.InsertOneAsync(product).ConfigureAwait(false);
            _logger.LogInformation($"Product created: {product.Name} ({product.Sku})");

            var dto = await MapProductToDto(product).ConfigureAwait(false);
            return ResponseWrapper<ProductResponseDto>.Ok(dto, "Product created successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error creating product: {ex.Message}");
            return ResponseWrapper<ProductResponseDto>.Fail("Error creating product");
        }
    }

    /// <summary>
    /// Update existing product
    /// </summary>
    public async Task<ResponseWrapper<ProductResponseDto>> UpdateAsync(Guid id, ProductUpdateDto request)
    {
        try
        {
            if (request == null)
            {
                return ResponseWrapper<ProductResponseDto>.Fail("Invalid product data");
            }

            // Verify product exists
            var product = await _context.Products
                .Find(p => p.Id == id)
                .FirstOrDefaultAsync()
                .ConfigureAwait(false);

            if (product == null)
            {
                return ResponseWrapper<ProductResponseDto>.Fail("Product not found");
            }

            // Check if SKU is being changed and new SKU already exists
            if (product.Sku != request.Sku)
            {
                var skuExists = await _context.Products
                    .Find(p => p.Sku == request.Sku && p.Id != id)
                    .AnyAsync()
                    .ConfigureAwait(false);

                if (skuExists)
                {
                    return ResponseWrapper<ProductResponseDto>.Fail("SKU already exists");
                }
            }

            // Verify category exists
            var category = await _context.Categories
                .Find(c => c.Id == request.CategoryId)
                .FirstOrDefaultAsync()
                .ConfigureAwait(false);

            if (category == null)
            {
                return ResponseWrapper<ProductResponseDto>.Fail("Category not found");
            }

            // Verify supplier exists (if provided)
            if (request.SupplierId.HasValue)
            {
                var supplier = await _context.Suppliers
                    .Find(s => s.Id == request.SupplierId)
                    .FirstOrDefaultAsync()
                    .ConfigureAwait(false);

                if (supplier == null)
                {
                    return ResponseWrapper<ProductResponseDto>.Fail("Supplier not found");
                }
            }

            // Update product
            // prepare update values for all editable fields
            var update = Builders<Product>.Update
                .Set(p => p.Name, request.Name.Trim())
                .Set(p => p.Sku, request.Sku.Trim().ToUpper())
                .Set(p => p.CategoryId, request.CategoryId)
                .Set(p => p.SupplierId, request.SupplierId)
                .Set(p => p.Quantity, request.Quantity)
                .Set(p => p.ReorderLevel, request.ReorderLevel)
                .Set(p => p.UnitPrice, request.UnitPrice);

            await _context.Products.UpdateOneAsync(p => p.Id == id, update).ConfigureAwait(false);
            _logger.LogInformation($"Product updated: {id}");

            // Fetch and return updated product
            return await GetByIdAsync(id).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error updating product {id}: {ex.Message}");
            return ResponseWrapper<ProductResponseDto>.Fail("Error updating product");
        }
    }

    /// <summary>
    /// Delete product
    /// </summary>
    public async Task<ResponseWrapper<bool>> DeleteAsync(Guid id)
    {
        try
        {
            // Verify product exists
            var product = await _context.Products
                .Find(p => p.Id == id)
                .FirstOrDefaultAsync()
                .ConfigureAwait(false);

            if (product == null)
            {
                return ResponseWrapper<bool>.Fail("Product not found");
            }

            var result = await _context.Products
                .DeleteOneAsync(p => p.Id == id)
                .ConfigureAwait(false);

            _logger.LogInformation($"Product deleted: {id} ({product.Name})");
            // true only when delete actually removed a document
            return ResponseWrapper<bool>.Ok(result.DeletedCount > 0, "Product deleted successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error deleting product {id}: {ex.Message}");
            return ResponseWrapper<bool>.Fail("Error deleting product");
        }
    }

    /// <summary>
    /// Helper - Map product entity to DTO with related data
    /// </summary>
    private async Task<ProductResponseDto> MapProductToDto(Product product)
    {
        try
        {
            // fetch category name for display
            var category = await _context.Categories
                .Find(c => c.Id == product.CategoryId)
                .FirstOrDefaultAsync()
                .ConfigureAwait(false);

            // optional supplier lookup when id provided
            var supplier = product.SupplierId.HasValue
                ? await _context.Suppliers
                    .Find(s => s.Id == product.SupplierId)
                    .FirstOrDefaultAsync()
                    .ConfigureAwait(false)
                : null;

            return new ProductResponseDto(
                product.Id,
                product.Name,
                product.Sku,
                product.CategoryId,
                category?.Name ?? "Unknown",
                product.SupplierId,
                supplier?.Name,
                product.Quantity,
                product.ReorderLevel,
                product.UnitPrice,
                product.CreatedAt
            );
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error mapping product to DTO: {ex.Message}");
            // Return minimal DTO on error
            return new ProductResponseDto(
                product.Id, product.Name, product.Sku, product.CategoryId, "Unknown",
                product.SupplierId, null, product.Quantity, product.ReorderLevel,
                product.UnitPrice, product.CreatedAt
            );
        }
    }
}
