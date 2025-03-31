namespace FormBuilder.Models
{
    public class ContainerStyle
    {
        public LayoutType LayoutType { get; set; } = LayoutType.Flex;
        public FlexStyle Flex { get; set; } = new();
        public GridStyle Grid { get; set; } = new();
        public string CustomCss { get; set; }
        public string BackgroundColor { get; set; }
        public string Padding { get; set; }
        public string Margin { get; set; }
        public string Border { get; set; }
    }
}
