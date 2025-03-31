using Microsoft.VisualBasic.FileIO;

namespace FormBuilder.Models
{
    // Models/Form.cs
    public class Form
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public List<FormContainer> Containers { get; set; } = new();
        public bool IsMultiStep { get; set; }
        public List<FormStep> Steps { get; set; } = new();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public string CustomCss { get; set; }
        public string CustomJs { get; set; }
    }

 
}