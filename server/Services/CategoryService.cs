using MongoDB.Driver;
using Microsoft.Extensions.Logging;
using server.Data;
using server.Helpers;
using server.Models;

namespace server.Services;

public class CategoryService
{
    private readonly MongoDbContext _context;
    private readonly ILogger<CategoryService> _logger;

    public CategoryService(MongoDbContext context, ILogger<CategoryService> logger)
    {
        // keep context and logger for later use
        _context = context;
        _logger = logger;
    }

    public async Task<ResponseWrapper<IEnumerable<Category>>> GetAllAsync()
    {
        try
        {
            // grab all categories sorted by name
            var categories = await _context.Categories
                .Find(_ => true)
                .SortBy(c => c.Name)
                .ToListAsync()
                .ConfigureAwait(false);
            return ResponseWrapper<IEnumerable<Category>>.Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching categories: {ex.Message}");
            return ResponseWrapper<IEnumerable<Category>>.Fail("Error fetching categories");
        }
    }

    public async Task<ResponseWrapper<Category>> GetByIdAsync(Guid id)
    {
        try
        {
            var category = await _context.Categories
                .Find(c => c.Id == id)
                .FirstOrDefaultAsync()
                .ConfigureAwait(false);

            if (category == null)
            {
                return ResponseWrapper<Category>.Fail("Category not found");
            }
            return ResponseWrapper<Category>.Ok(category);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching category {id}: {ex.Message}");
            return ResponseWrapper<Category>.Fail("Error fetching category");
        }
    }

    public async Task<ResponseWrapper<Category>> CreateAsync(Category category)
    {
        try
        {
            if (category == null || string.IsNullOrWhiteSpace(category.Name))
            {
                return ResponseWrapper<Category>.Fail("Invalid category data");
            }

            // assign new id before insert
            category.Id = Guid.NewGuid();
            await _context.Categories.InsertOneAsync(category).ConfigureAwait(false);
            _logger.LogInformation($"Category created: {category.Name}");
            return ResponseWrapper<Category>.Ok(category);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error creating category: {ex.Message}");
            return ResponseWrapper<Category>.Fail("Error creating category");
        }
    }

    public async Task<ResponseWrapper<Category>> UpdateAsync(Guid id, Category request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Name))
            {
                return ResponseWrapper<Category>.Fail("Invalid category data");
            }

            // build update definition for name and description
            var update = Builders<Category>.Update
                .Set(c => c.Name, request.Name)
                .Set(c => c.Description, request.Description);

            var result = await _context.Categories
                .UpdateOneAsync(c => c.Id == id, update)
                .ConfigureAwait(false);

            if (result.MatchedCount == 0)
            {
                return ResponseWrapper<Category>.Fail("Category not found");
            }

            _logger.LogInformation($"Category updated: {id}");
            var updated = await _context.Categories
                .Find(c => c.Id == id)
                .FirstOrDefaultAsync()
                .ConfigureAwait(false);

            return ResponseWrapper<Category>.Ok(updated!);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error updating category {id}: {ex.Message}");
            return ResponseWrapper<Category>.Fail("Error updating category");
        }
    }

    public async Task<ResponseWrapper<bool>> DeleteAsync(Guid id)
    {
        try
        {
            var result = await _context.Categories
                .DeleteOneAsync(c => c.Id == id)
                .ConfigureAwait(false);

            // no match means category missing
            if (result.DeletedCount == 0)
            {
                return ResponseWrapper<bool>.Fail("Category not found");
            }

            _logger.LogInformation($"Category deleted: {id}");
            return ResponseWrapper<bool>.Ok(true);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error deleting category {id}: {ex.Message}");
            return ResponseWrapper<bool>.Fail("Error deleting category");
        }
    }
}
