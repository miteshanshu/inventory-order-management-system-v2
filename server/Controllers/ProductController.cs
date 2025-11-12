using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductController : ControllerBase
{
    private readonly ProductService _productService;

    public ProductController(ProductService productService)
    {
        // hang onto service so we reuse product logic
        _productService = productService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // pull full product catalog for listings
        var result = await _productService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        // fetch single product with stock info
        var result = await _productService.GetByIdAsync(id);
        if (!result.Success)
        {
            // 404 when product id does not exist
            return NotFound(result);
        }
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(ProductCreateDto request)
    {
        // create product from admin form data
        var result = await _productService.CreateAsync(request);
        if (!result.Success)
        {
            // bubble validation errors back to ui
            return BadRequest(result);
        }
        return Created("", result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, ProductUpdateDto request)
    {
        // update product attributes like price or stock
        var result = await _productService.UpdateAsync(id, request);
        if (!result.Success)
        {
            // missing product still signals not found
            return NotFound(result);
        }
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        // remove product from catalog
        var result = await _productService.DeleteAsync(id);
        if (!result.Success)
        {
            // tell client when the id is already gone
            return NotFound(result);
        }
        return Ok(result);
    }
}
