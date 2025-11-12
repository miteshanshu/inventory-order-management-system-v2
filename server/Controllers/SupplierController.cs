using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.Models;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SupplierController : ControllerBase
{
    private readonly SupplierService _supplierService;

    public SupplierController(SupplierService supplierService)
    {
        // keep service handy to delegate supplier logic
        _supplierService = supplierService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // gather all suppliers to show contact list
        var result = await _supplierService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        // lookup single supplier detail
        var result = await _supplierService.GetByIdAsync(id);
        if (!result.Success)
        {
            // 404 tells caller supplier is missing
            return NotFound(result);
        }
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(Supplier request)
    {
        // create supplier from admin input
        var result = await _supplierService.CreateAsync(request);
        return Created("", result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, Supplier request)
    {
        // update supplier contact and business info
        var result = await _supplierService.UpdateAsync(id, request);
        if (!result.Success)
        {
            // return not found when target id vanished
            return NotFound(result);
        }
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        // remove supplier when no longer active
        var result = await _supplierService.DeleteAsync(id);
        if (!result.Success)
        {
            // confirm missing id with 404 response
            return NotFound(result);
        }
        return Ok(result);
    }
}
