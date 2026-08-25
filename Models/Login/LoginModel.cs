using System.ComponentModel.DataAnnotations;

namespace CarCareTracker.Models
{
    public class LoginModel
    {
        [Required]
        [StringLength(50)]
        public string UserName { get; set; } = string.Empty;
        
        [StringLength(128)]
        public string Password { get; set; } = string.Empty;

        [EmailAddress]
        [StringLength(100)]
        public string EmailAddress { get; set; } = string.Empty;

        [StringLength(100)]
        public string Token { get; set; } = string.Empty;

        public bool IsPersistent { get; set; } = false;
    }
}
