using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace OrderChina.AdminApi.Controllers;

[ApiController]
[Route("uploads")]
[Authorize]
public class UploadsController : ControllerBase
{
    private const long MaxFileSizeBytes = 5 * 1024 * 1024;

    private readonly IWebHostEnvironment _environment;

    public UploadsController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [HttpPost("products")]
    [RequestSizeLimit(MaxFileSizeBytes)]
    public async Task<IActionResult> UploadProductImage(IFormFile? file, CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { error = "Vui lòng chọn file ảnh." });
        }

        if (file.Length > MaxFileSizeBytes)
        {
            return BadRequest(new { error = "Ảnh không được vượt quá 5MB." });
        }

        await using var stream = file.OpenReadStream();
        var extension = await DetectImageExtensionAsync(stream, cancellationToken);
        if (extension is null)
        {
            return BadRequest(new { error = "File không phải ảnh hợp lệ (chỉ nhận JPG, PNG, GIF, WEBP)." });
        }

        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var uploadsDir = Path.Combine(webRoot, "uploads", "products");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadsDir, fileName);

        stream.Seek(0, SeekOrigin.Begin);
        await using (var output = new FileStream(filePath, FileMode.Create))
        {
            await stream.CopyToAsync(output, cancellationToken);
        }

        return Ok(new { url = $"/uploads/products/{fileName}" });
    }

    /// <summary>
    /// Nhận diện định dạng ảnh qua magic bytes thực tế của nội dung file — KHÔNG tin đuôi file/Content-Type
    /// client gửi lên (dễ giả mạo), để chặn file độc hại đội lốt ảnh.
    /// </summary>
    private static async Task<string?> DetectImageExtensionAsync(Stream stream, CancellationToken cancellationToken)
    {
        var header = new byte[12];
        var bytesRead = await stream.ReadAsync(header.AsMemory(0, header.Length), cancellationToken);
        if (bytesRead < 4)
        {
            return null;
        }

        if (header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
        {
            return ".jpg";
        }

        if (header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47
            && header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A)
        {
            return ".png";
        }

        if (header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x38)
        {
            return ".gif";
        }

        if (bytesRead >= 12
            && header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46
            && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50)
        {
            return ".webp";
        }

        return null;
    }
}
