using MongoDB.Driver;
using Microsoft.Extensions.Logging;
using server.Data;
using server.Helpers;
using server.Models;

namespace server.Services;

public class SupplierService
{
    private readonly MongoDbContext _context;
    private readonly ILogger<SupplierService> _logger;

    public SupplierService(MongoDbContext context, ILogger<SupplierService> logger)
    {
        // store context and logger for reuse
        _context = context;
        _logger = logger;
    }

    public async Task<ResponseWrapper<IEnumerable<Supplier>>> GetAllAsync()
    {
        try
        {
            // fetch all suppliers ordered by name
            var suppliers = await _context.Suppliers
                .Find(_ => true)
                .SortBy(s => s.Name)
                .ToListAsync()
                .ConfigureAwait(false);
            return ResponseWrapper<IEnumerable<Supplier>>.Ok(suppliers);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching suppliers: {ex.Message}");
            return ResponseWrapper<IEnumerable<Supplier>>.Fail("Error fetching suppliers");
        }
    }

    public async Task<ResponseWrapper<Supplier>> GetByIdAsync(Guid id)
    {
        try
        {
            var supplier = await _context.Suppliers
                .Find(s => s.Id == id)
                .FirstOrDefaultAsync()
                .ConfigureAwait(false);

            if (supplier == null)
            {
                return ResponseWrapper<Supplier>.Fail("Supplier not found");
            }
            return ResponseWrapper<Supplier>.Ok(supplier);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error fetching supplier {id}: {ex.Message}");
            return ResponseWrapper<Supplier>.Fail("Error fetching supplier");
        }
    }

    public async Task<ResponseWrapper<Supplier>> CreateAsync(Supplier supplier)
    {
        try
        {
            if (supplier == null || string.IsNullOrWhiteSpace(supplier.Name))
            {
                return ResponseWrapper<Supplier>.Fail("Invalid supplier data");
            }

            // assign new id before saving
            supplier.Id = Guid.NewGuid();
            await _context.Suppliers.InsertOneAsync(supplier).ConfigureAwait(false);
            _logger.LogInformation($"Supplier created: {supplier.Name}");
            return ResponseWrapper<Supplier>.Ok(supplier);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error creating supplier: {ex.Message}");
            return ResponseWrapper<Supplier>.Fail("Error creating supplier");
        }
    }

    public async Task<ResponseWrapper<Supplier>> UpdateAsync(Guid id, Supplier request)
    {
        try
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Name))
            {
                return ResponseWrapper<Supplier>.Fail("Invalid supplier data");
            }

            // update contact info fields
            var update = Builders<Supplier>.Update
                .Set(s => s.Name, request.Name)
                .Set(s => s.ContactEmail, request.ContactEmail)
                .Set(s => s.Phone, request.Phone)
                .Set(s => s.Address, request.Address);

            var result = await _context.Suppliers
                .UpdateOneAsync(s => s.Id == id, update)
                .ConfigureAwait(false);

            if (result.MatchedCount == 0)
            {
                return ResponseWrapper<Supplier>.Fail("Supplier not found");
            }

            _logger.LogInformation($"Supplier updated: {id}");
            var updated = await _context.Suppliers
                .Find(s => s.Id == id)
                .FirstOrDefaultAsync()
                .ConfigureAwait(false);

            return ResponseWrapper<Supplier>.Ok(updated!);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error updating supplier {id}: {ex.Message}");
            return ResponseWrapper<Supplier>.Fail("Error updating supplier");
        }
    }

    public async Task<ResponseWrapper<bool>> DeleteAsync(Guid id)
    {
        try
        {
            var result = await _context.Suppliers
                .DeleteOneAsync(s => s.Id == id)
                .ConfigureAwait(false);

            // nothing deleted when supplier not found
            if (result.DeletedCount == 0)
            {
                return ResponseWrapper<bool>.Fail("Supplier not found");
            }

            _logger.LogInformation($"Supplier deleted: {id}");
            return ResponseWrapper<bool>.Ok(true);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error deleting supplier {id}: {ex.Message}");
            return ResponseWrapper<bool>.Fail("Error deleting supplier");
        }
    }
}
