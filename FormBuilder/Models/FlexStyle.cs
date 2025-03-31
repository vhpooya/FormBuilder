namespace FormBuilder.Models
{
    public class FlexStyle
    {
        public string Direction { get; set; } = "row";
        public string JustifyContent { get; set; } = "flex-start";
        public string AlignItems { get; set; } = "stretch";
        public string Gap { get; set; } = "0";
        public bool Wrap { get; set; }
    }
}
