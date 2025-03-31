namespace FormBuilder.Models
{
    public class FieldValidation
    {
        public int? MinLength { get; set; }
        public int? MaxLength { get; set; }
        public string Pattern { get; set; }
        public string ErrorMessage { get; set; }
    }



}
