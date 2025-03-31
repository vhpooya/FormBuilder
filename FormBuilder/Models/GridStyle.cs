namespace FormBuilder.Models
{
    public class GridStyle
    {
        public int Columns { get; set; } = 1;
        public int Rows { get; set; } = 1;
        public string Gap { get; set; } = "0";
        public string TemplateColumns { get; set; }
        public string TemplateRows { get; set; }
    }
}
