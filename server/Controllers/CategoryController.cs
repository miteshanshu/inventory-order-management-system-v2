using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.Models;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoryController : ControllerBase
{
    private readonly CategoryService _categoryService;

    public CategoryController(CategoryService categoryService)
    {
        // keep service so we reuse business checks across actions
        _categoryService = categoryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // fetch every category for listing screens
        var result = await _categoryService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        // look up category and keep missing case clear
        var result = await _categoryService.GetByIdAsync(id);
        if (!result.Success)
        {
            // 404 tells client the id is not present
            return NotFound(result);
        }
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create(Category request)
    {
        // create category so admin can expand catalog
        var result = await _categoryService.CreateAsync(request);
        return Created("", result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, Category request)
    {
        // push updates while keeping missing ids safe
        var result = await _categoryService.UpdateAsync(id, request);
        if (!result.Success)
        {
            // send not found when update target is gone
            return NotFound(result);
        }
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        // remove category and confirm outcome
        var result = await _categoryService.DeleteAsync(id);
        if (!result.Success)
        {
            // missing id also comes back as not found
            return NotFound(result);
        }
        return Ok(result);
    }
}
