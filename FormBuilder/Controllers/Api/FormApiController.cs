
using FormBuilder.Models;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Mvc;

namespace FormBuilder.Controllers.Api
{
    // Controllers/Api/FormApiController.cs
    [Route("api/forms")]
    [ApiController]
    public class FormApiController : ControllerBase
    {
        private readonly IFormService _formService;

        public FormApiController(IFormService formService)
        {
            _formService = formService;
        }

        [HttpPost]
        public IActionResult CreateForm([FromBody] Form form)
        {
            var createdForm = _formService.CreateForm(form);
            return CreatedAtAction(nameof(GetForm), new { id = createdForm.Id }, createdForm);
        }

        [HttpGet("{id}")]
        public IActionResult GetForm(Guid id)
        {
            var form = _formService.GetFormById(id);
            if (form == null)
            {
                return NotFound();
            }
            return Ok(form);
        }

        [HttpPost("{id}/submit")]
        public IActionResult SubmitForm(Guid id, [FromBody] Dictionary<string, object> formData)
        {
            // Validate and process form submission
            var result = _formService.ProcessFormSubmission(id, formData);
            if (!result.IsValid)
            {
                return BadRequest(result.Errors);
            }

            return Ok(new { success = true, data = result.Data });
        }
    }
}