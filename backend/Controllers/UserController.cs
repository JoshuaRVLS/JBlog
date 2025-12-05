using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        static private List<User> users = new List<User>
        {
            new User { Id = 1, Username = "joshuarvl", Password = "password" },
            new User { Id = 2, Username = "joshuarvl2", Password = "password2" }
        };

        [HttpGet (Name = "GetUsers")]
        public ActionResult<IEnumerable<User>> GetUsers()
        {
            return Ok(users);
        }
        
        [HttpGet("{id}", Name = "GetUser")]
        public ActionResult<User> GetUser(int id)
        {
            var user = users.FirstOrDefault(user => user.Id == id);
            if (user == null)
            {
                return NotFound();
            }
            return Ok(user);
        }

        [HttpPost(Name = "CreateUser")]
        public ActionResult<User> CreateUser(User newUser)
        {
            users.Add(newUser);
            return Ok();
        }
    }

}