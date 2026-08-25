using System.ComponentModel.DataAnnotations;

namespace CarCareTracker.Models
{
    public class UserData
    {
        public int Id { get; set; }
        [Required]
        [StringLength(50)]
        public string UserName { get; set; } = string.Empty;
        
        [EmailAddress]
        [StringLength(100)]
        public string EmailAddress { get; set; } = string.Empty;
        
        [StringLength(128)]
        public string Password { get; set; } = string.Empty;
        public bool IsAdmin { get; set; }
        public bool IsRootUser { get; set; } = false;
    }
}