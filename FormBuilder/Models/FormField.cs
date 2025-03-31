using Microsoft.VisualBasic.FileIO;

namespace FormBuilder.Models
{
    public class FormField
    {
        public Guid Id { get; set; }
        public string FieldType { get; set; } // text, number, email, select, etc.
        public string Label { get; set; }
        public string Name { get; set; }
        public string Placeholder { get; set; }
        public string Tooltip { get; set; }
        public string DefaultValue { get; set; }
        public bool IsRequired { get; set; }
        public FieldValidation Validation { get; set; } = new();
        public FieldStyle Style { get; set; } = new();
        public List<FieldOption> Options { get; set; } = new();
        public ConditionalLogic ConditionalLogic { get; set; }
    }

}