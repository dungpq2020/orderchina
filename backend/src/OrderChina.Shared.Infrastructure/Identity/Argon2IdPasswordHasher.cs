using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using OrderChina.Shared.Domain.Identity;

namespace OrderChina.Shared.Infrastructure.Identity;

/// <summary>
/// Thay thế PasswordHasher mặc định của ASP.NET Core Identity (PBKDF2) bằng Argon2id —
/// thuật toán OWASP khuyến nghị hàng đầu hiện nay để chống GPU/ASIC cracking.
/// Tham số mặc định (19 MiB, 2 iterations, độ song song 1) theo khuyến nghị OWASP Password Storage Cheat Sheet
/// cho Argon2id chạy trên server thông thường (không có phần cứng chuyên dụng) — chỉnh lại nếu benchmark thực tế cần khác.
/// </summary>
public class Argon2IdPasswordHasher : IPasswordHasher<ApplicationUser>
{
    private const int SaltSizeBytes = 16;
    private const int HashSizeBytes = 32;
    private const int MemorySizeKb = 19 * 1024;
    private const int Iterations = 2;
    private const int Parallelism = 1;

    public string HashPassword(ApplicationUser user, string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSizeBytes);
        var hash = ComputeHash(password, salt, MemorySizeKb, Iterations, Parallelism);
        return Encode(salt, hash, MemorySizeKb, Iterations, Parallelism);
    }

    public PasswordVerificationResult VerifyHashedPassword(ApplicationUser user, string hashedPassword, string providedPassword)
    {
        if (!TryDecode(hashedPassword, out var salt, out var expectedHash, out var memoryKb, out var iterations, out var parallelism))
        {
            return PasswordVerificationResult.Failed;
        }

        var actualHash = ComputeHash(providedPassword, salt, memoryKb, iterations, parallelism);

        if (!CryptographicOperations.FixedTimeEquals(actualHash, expectedHash))
        {
            return PasswordVerificationResult.Failed;
        }

        var isUsingCurrentParameters = memoryKb == MemorySizeKb && iterations == Iterations && parallelism == Parallelism;
        return isUsingCurrentParameters
            ? PasswordVerificationResult.Success
            : PasswordVerificationResult.SuccessRehashNeeded;
    }

    private static byte[] ComputeHash(string password, byte[] salt, int memoryKb, int iterations, int parallelism)
    {
        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            DegreeOfParallelism = parallelism,
            MemorySize = memoryKb,
            Iterations = iterations
        };

        return argon2.GetBytes(HashSizeBytes);
    }

    private static string Encode(byte[] salt, byte[] hash, int memoryKb, int iterations, int parallelism)
    {
        return string.Create(CultureInfo.InvariantCulture,
            $"$argon2id$v=19$m={memoryKb},t={iterations},p={parallelism}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}");
    }

    private static bool TryDecode(string encoded, out byte[] salt, out byte[] hash, out int memoryKb, out int iterations, out int parallelism)
    {
        salt = Array.Empty<byte>();
        hash = Array.Empty<byte>();
        memoryKb = 0;
        iterations = 0;
        parallelism = 0;

        var parts = encoded.Split('$', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length != 5 || parts[0] != "argon2id")
        {
            return false;
        }

        try
        {
            var parameterParts = parts[2].Split(',');
            memoryKb = int.Parse(parameterParts[0].Split('=')[1], CultureInfo.InvariantCulture);
            iterations = int.Parse(parameterParts[1].Split('=')[1], CultureInfo.InvariantCulture);
            parallelism = int.Parse(parameterParts[2].Split('=')[1], CultureInfo.InvariantCulture);
            salt = Convert.FromBase64String(parts[3]);
            hash = Convert.FromBase64String(parts[4]);
            return true;
        }
        catch (Exception ex) when (ex is FormatException or IndexOutOfRangeException or OverflowException)
        {
            return false;
        }
    }
}
