namespace FormBuilder.Models
{
    public class FormStep
    {
        public int Order { get; set; }
        public string Title { get; set; }
        public List<FormContainer> Containers { get; set; } = new();
    }
}
