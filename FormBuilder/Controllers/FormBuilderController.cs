using FormBuilder.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Mvc;

namespace FormBuilder.Controllers
{
    // Controllers/FormBuilderController.cs
    [Authorize]
    public class FormBuilderController : Controller
    {
        private readonly IFormService _formService;

        public FormBuilderController(IFormService formService)
        {
            _formService = formService;
        }

        public IActionResult Index()
        {
            var forms = _formService.GetAllForms();
            return View(forms);
        }

        [HttpGet]
        public IActionResult Create()
        {
            return View("FormDesigner", new Form());
        }

        [HttpGet]
        public IActionResult Edit(Guid id)
        {
            var form = _formService.GetFormById(id);
            if (form == null)
            {
                return NotFound();
            }
            return View("FormDesigner", form);
        }

        [HttpPost]
        public IActionResult Save(Form form)
        {
            if (!ModelState.IsValid)
            {
                return View("FormDesigner", form);
            }

            if (form.Id == Guid.Empty)
            {
                _formService.CreateForm(form);
            }
            else
            {
                _formService.UpdateForm(form);
            }

            return RedirectToAction("Index");
        }

        [HttpGet]
        public IActionResult Preview(Guid id)
        {
            var form = _formService.GetFormById(id);
            if (form == null)
            {
                return NotFound();
            }
            return View(form);
        }

        [HttpGet]
        public IActionResult GetFormHtml(Guid id)
        {
            var form = _formService.GetFormById(id);
            if (form == null)
            {
                return NotFound();
            }

            var html = _formService.GenerateFormHtml(form);
            return Content(html, "text/html");
        }

        [HttpGet]
        public IActionResult GetFormJson(Guid id)
        {
            var form = _formService.GetFormById(id);
            if (form == null)
            {
                return NotFound();
            }

            return Json(form);
        }
    }
}