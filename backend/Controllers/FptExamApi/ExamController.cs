using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using backend.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace backend.Controllers.FptExamApi
{
    //[Authorize(Authorization.Role.ExaminerHead)]
    [ApiController]
	[Route("api/[controller]")]
	public class ExamController: ControllerBase
	{
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
		public ExamController(IConfiguration configuration,HttpClient httpClient)
		{
            _configuration = configuration;
            _httpClient = httpClient;
		}
        [HttpPost("get-exam")]
        public async Task<IActionResult> GetExam(string campusCode, DateTime startDate, DateTime endDate)
        {
            string privateKey = _configuration["AppSettings:PrivateKey"];
            string hashCode = _configuration["AppSettings:HashCode"];

            string checksum = getCheckSum(privateKey + "FEEN" + campusCode + DateTime.Now.ToString("dd/MM/yyyy HH:00"), hashCode);
            Console.WriteLine("this is check sum");
            Console.WriteLine(checksum);
            string url = $"https://api.fpt.edu.vn/fap/api/FeeN/GetExam?campusCode={campusCode}&checksum={checksum}&startDate={startDate:yyyy-MM-dd}&endDate={endDate:yyyy-MM-dd}";
            Console.WriteLine("this is url of the fpt api :");
            Console.WriteLine(url);

            var requestBody = new StringContent("", Encoding.UTF8, "application/json"); // Adjust if the API expects a specific body
            Console.WriteLine("this is request body to pass into postAsync");
            Console.WriteLine(requestBody);
            Console.WriteLine($"start fetch : {DateTime.Now.ToString("h:mm:ss tt")}");
            HttpResponseMessage response = await _httpClient.PostAsync(url, requestBody);
            Console.WriteLine($"done fetch : {DateTime.Now.ToString("h:mm:ss tt")}");
            
            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine($"start read fetch : {DateTime.Now.ToString("h:mm:ss tt")}");
                string responseBody = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"done read fetch : {DateTime.Now.ToString("h:mm:ss tt")}");
                return Ok(responseBody);
            }
            else
            {
                return StatusCode((int)response.StatusCode, response.ReasonPhrase);
            }
        }
        [HttpGet("get-all-students-fee")]
        public async Task<IActionResult> GetAllStudentsFee(string campusCode)
        {
            string privateKey = _configuration["AppSettings:PrivateKey"];
            string hashCode = _configuration["AppSettings:HashCode"];

            string checksum = getCheckSum(privateKey + "FEEN" + campusCode + DateTime.Now.ToString("dd/MM/yyyy HH:00"), hashCode);
            Console.WriteLine("this is check sum");
            Console.WriteLine(checksum);
            string url = $"https://api.fpt.edu.vn/fap/api/FeeN/GetAllStudentsFeeN?campusCode={campusCode}&checksum={checksum}";
            Console.WriteLine("this is url of the fpt api :");
            Console.WriteLine(url);

            Console.WriteLine($"start fetch : {DateTime.Now.ToString("h:mm:ss tt")}");
            HttpResponseMessage response = await _httpClient.GetAsync(url);
            Console.WriteLine($"done fetch : {DateTime.Now.ToString("h:mm:ss tt")}");
    
            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine($"start read fetch : {DateTime.Now.ToString("h:mm:ss tt")}");
                string responseBody = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"done read fetch : {DateTime.Now.ToString("h:mm:ss tt")}");
                return Ok(responseBody);
            }
            else
            {
                return StatusCode((int)response.StatusCode, response.ReasonPhrase);
            }
        }


        public static string getCheckSum(string value, string hashKey)
        {
            var encoding = new System.Text.ASCIIEncoding();
            //string[] connect = getViettelConnectionInformation(campusCode);
            string hash_key = hashKey;

            // string hash_key = ConfigurationManager.AppSettings["hash_key_viettel"];
            byte[] keyByte = encoding.GetBytes(hash_key);
            byte[] messageBytes = encoding.GetBytes(value);
            string check_sum = "";
            using (var hmacsha1 = new System.Security.Cryptography.HMACSHA1(keyByte))
            {
                byte[] hashmessage = hmacsha1.ComputeHash(messageBytes);
                check_sum = Convert.ToBase64String(hashmessage).Replace("=", "%3d").Replace(" ", "+");
            }
            return check_sum;
        }
    }
}

