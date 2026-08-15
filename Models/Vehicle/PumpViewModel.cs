namespace CarCareTracker.Models
{
    public class PumpViewModel
    {
        public int Id { get; set; }
        public int Year { get; set; }
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string VehicleName => $"{Year} {Make} {Model}".Trim();
        public int LastOdometer { get; set; }
    }
}
