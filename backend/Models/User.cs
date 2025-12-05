namespace backend.Models
{
    public class User
    {
        public int Id {get; set;}

        public String Username {get; set;} = null!;

        public String Password {get; set;} = null!;
    }
}