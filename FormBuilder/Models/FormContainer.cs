using Microsoft.VisualBasic.FileIO;

namespace FormBuilder.Models
{
  

    public class FormContainer
    {
        public Guid Id { get; set; }
        public ContainerType Type { get; set; }
        public List<FormField> Fields { get; set; } = new();
        public ContainerStyle Style { get; set; } = new();
    }

   
  
  

   

    public enum ContainerType
    {
        Div,
        Section,
        Fieldset
    }

    public enum LayoutType
    {
        Flex,
        Grid,
        Columns
    }
}
