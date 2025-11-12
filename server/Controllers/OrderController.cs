using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.DTOs;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrderController : ControllerBase
{
    private readonly OrderService _orderService;

    public OrderController(OrderService orderService)
    {
        // hold service so every action uses same rules
        _orderService = orderService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // list all orders for dashboards
        var result = await _orderService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        // fetch one order with items and totals
        var result = await _orderService.GetByIdAsync(id);
        if (!result.Success)
        {
            // return 404 to signal missing order
            return NotFound(result);
        }
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Create(OrderCreateDto request)
    {
        // create order from incoming payload
        var result = await _orderService.CreateAsync(request);
        if (!result.Success)
        {
            // send back validation notes when build fails
            return BadRequest(result);
        }
        return Created("", result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        // remove order and return outcome
        var result = await _orderService.DeleteAsync(id);
        if (!result.Success)
        {
            // not found keeps clients aware of stale ids
            return NotFound(result);
        }
        return Ok(result);
    }
}
