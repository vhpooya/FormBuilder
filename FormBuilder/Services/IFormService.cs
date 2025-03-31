using Microsoft.VisualBasic.FileIO;
using System.Text;

namespace FormBuilder.Models.Services
{
    // Services/IFormService.cs
    public interface IFormService
    {
        Form CreateForm(Form form);
        Form UpdateForm(Form form);
        Form GetFormById(Guid id);
        IEnumerable<Form> GetAllForms();
        string GenerateFormHtml(Form form);
        FormSubmissionResult ProcessFormSubmission(Guid formId, Dictionary<string, object> formData);
    }

    // Services/FormService.cs
    public class FormService : IFormService
    {
        private readonly ApplicationDbContext _context;

        public FormService(ApplicationDbContext context)
        {
            _context = context;
        }

        public Form CreateForm(Form form)
        {
            form.Id = Guid.NewGuid();
            form.CreatedAt = DateTime.UtcNow;

            _context.Forms.Add(form);
            _context.SaveChanges();

            return form;
        }

        public Form UpdateForm(Form form)
        {
            var existingForm = _context.Forms.Find(form.Id);
            if (existingForm == null)
            {
                throw new ArgumentException("Form not found");
            }

            existingForm.Title = form.Title;
            existingForm.Description = form.Description;
            existingForm.Containers = form.Containers;
            existingForm.IsMultiStep = form.IsMultiStep;
            existingForm.Steps = form.Steps;
            existingForm.UpdatedAt = DateTime.UtcNow;
            existingForm.CustomCss = form.CustomCss;
            existingForm.CustomJs = form.CustomJs;

            _context.SaveChanges();

            return existingForm;
        }

        public string GenerateFormHtml(Form form)
        {
            var sb = new StringBuilder();

            // Generate form HTML based on the form structure
            sb.AppendLine($"<form id=\"form-{form.Id}\" class=\"dynamic-form\">");

            foreach (var container in form.Containers)
            {
                sb.AppendLine(RenderContainer(container));
            }

            sb.AppendLine("</form>");

            // Add custom CSS and JS
            if (!string.IsNullOrEmpty(form.CustomCss))
            {
                sb.AppendLine($"<style>{form.CustomCss}</style>");
            }

            if (!string.IsNullOrEmpty(form.CustomJs))
            {
                sb.AppendLine($"<script>{form.CustomJs}</script>");
            }

            return sb.ToString();
        }

        private string RenderContainer(FormContainer container)
        {
            var sb = new StringBuilder();

            // Start container with appropriate styling
            sb.AppendLine($"<div class=\"form-container {GetContainerClasses(container)}\" style=\"{GetContainerStyles(container)}\">");

            foreach (var field in container.Fields)
            {
                sb.AppendLine(RenderField(field));
            }

            sb.AppendLine("</div>");

            return sb.ToString();
        }

        private string GetContainerClasses(FormContainer container)
        {
            var classes = new List<string>();

            if (container.Style.LayoutType == LayoutType.Flex)
            {
                classes.Add("d-flex");
                classes.Add($"flex-{container.Style.Flex.Direction}");

                if (container.Style.Flex.Wrap)
                {
                    classes.Add("flex-wrap");
                }
            }
            else if (container.Style.LayoutType == LayoutType.Grid)
            {
                classes.Add("grid-container");
            }

            return string.Join(" ", classes);
        }

        private string GetContainerStyles(FormContainer container)
        {
            var styles = new List<string>();

            if (container.Style.LayoutType == LayoutType.Flex)
            {
                if (!string.IsNullOrEmpty(container.Style.Flex.JustifyContent))
                {
                    styles.Add($"justify-content: {container.Style.Flex.JustifyContent};");
                }

                if (!string.IsNullOrEmpty(container.Style.Flex.AlignItems))
                {
                    styles.Add($"align-items: {container.Style.Flex.AlignItems};");
                }

                if (!string.IsNullOrEmpty(container.Style.Flex.Gap))
                {
                    styles.Add($"gap: {container.Style.Flex.Gap};");
                }
            }
            else if (container.Style.LayoutType == LayoutType.Grid)
            {
                if (container.Style.Grid.Columns > 0)
                {
                    styles.Add($"grid-template-columns: repeat({container.Style.Grid.Columns}, 1fr);");
                }

                if (!string.IsNullOrEmpty(container.Style.Grid.TemplateColumns))
                {
                    styles.Add($"grid-template-columns: {container.Style.Grid.TemplateColumns};");
                }

                if (!string.IsNullOrEmpty(container.Style.Grid.Gap))
                {
                    styles.Add($"gap: {container.Style.Grid.Gap};");
                }
            }

            // Add background, padding, margin, etc.
            if (!string.IsNullOrEmpty(container.Style.BackgroundColor))
            {
                styles.Add($"background-color: {container.Style.BackgroundColor};");
            }

            if (!string.IsNullOrEmpty(container.Style.Padding))
            {
                styles.Add($"padding: {container.Style.Padding};");
            }

            if (!string.IsNullOrEmpty(container.Style.Margin))
            {
                styles.Add($"margin: {container.Style.Margin};");
            }

            if (!string.IsNullOrEmpty(container.Style.Border))
            {
                styles.Add($"border: {container.Style.Border};");
            }

            return string.Join(" ", styles);
        }

        private string RenderField(FormField field)
        {
            var sb = new StringBuilder();

            sb.AppendLine($"<div class=\"form-group mb-3\" data-field-id=\"{field.Id}\">");

            if (!string.IsNullOrEmpty(field.Label))
            {
                sb.AppendLine($"<label for=\"{field.Name}\" class=\"form-label\">{field.Label}</label>");
            }

            switch (field.FieldType.ToLower())
            {
                case "text":
                case "email":
                case "number":
                    sb.AppendLine($"<input type=\"{field.FieldType}\" class=\"form-control\" id=\"{field.Name}\" name=\"{field.Name}\" placeholder=\"{field.Placeholder}\" {(field.IsRequired ? "required" : "")} />");
                    break;
                case "textarea":
                    sb.AppendLine($"<textarea class=\"form-control\" id=\"{field.Name}\" name=\"{field.Name}\" placeholder=\"{field.Placeholder}\" {(field.IsRequired ? "required" : "")}></textarea>");
                    break;
                case "select":
                    sb.AppendLine($"<select class=\"form-select\" id=\"{field.Name}\" name=\"{field.Name}\" {(field.IsRequired ? "required" : "")}>");
                    foreach (var option in field.Options)
                    {
                        sb.AppendLine($"<option value=\"{option.Value}\">{option.Text}</option>");
                    }
                    sb.AppendLine("</select>");
                    break;
                case "checkbox":
                    foreach (var option in field.Options)
                    {
                        sb.AppendLine($"<div class=\"form-check\">");
                        sb.AppendLine($"<input class=\"form-check-input\" type=\"checkbox\" id=\"{field.Name}_{option.Value}\" name=\"{field.Name}\" value=\"{option.Value}\" />");
                        sb.AppendLine($"<label class=\"form-check-label\" for=\"{field.Name}_{option.Value}\">{option.Text}</label>");
                        sb.AppendLine("</div>");
                    }
                    break;
                case "radio":
                    foreach (var option in field.Options)
                    {
                        sb.AppendLine($"<div class=\"form-check\">");
                        sb.AppendLine($"<input class=\"form-check-input\" type=\"radio\" id=\"{field.Name}_{option.Value}\" name=\"{field.Name}\" value=\"{option.Value}\" {(field.IsRequired ? "required" : "")} />");
                        sb.AppendLine($"<label class=\"form-check-label\" for=\"{field.Name}_{option.Value}\">{option.Text}</label>");
                        sb.AppendLine("</div>");
                    }
                    break;
            }

            if (!string.IsNullOrEmpty(field.Tooltip))
            {
                sb.AppendLine($"<small class=\"form-text text-muted\">{field.Tooltip}</small>");
            }

            sb.AppendLine("</div>");

            return sb.ToString();
        }

        public FormSubmissionResult ProcessFormSubmission(Guid formId, Dictionary<string, object> formData)
        {
            var result = new FormSubmissionResult();
            var form = GetFormById(formId);

            if (form == null)
            {
                result.Errors.Add("Form not found");
                return result;
            }

            // Validate form data against form fields
            foreach (var container in form.Containers)
            {
                foreach (var field in container.Fields)
                {
                    if (field.IsRequired && (!formData.ContainsKey(field.Name) || formData[field.Name] == null || string.IsNullOrWhiteSpace(formData[field.Name].ToString())))
                    {
                        result.Errors.Add($"{field.Label} is required");
                    }

                    // Add more validation checks based on field type and validation rules
                }
            }

            if (result.Errors.Any())
            {
                return result;
            }

            // Process valid form data
            result.Data = formData;
            result.IsValid = true;

            // Here you would typically save the form data to a database
            // _context.FormSubmissions.Add(new FormSubmission { FormId = formId, Data = formData });
            // _context.SaveChanges();

            return result;
        }
    }

    public class FormSubmissionResult
    {
        public bool IsValid { get; set; }
        public List<string> Errors { get; set; } = new();
        public Dictionary<string, object> Data { get; set; }
    }
}