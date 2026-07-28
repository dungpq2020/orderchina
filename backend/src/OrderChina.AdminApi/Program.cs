using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using OrderChina.Shared.Infrastructure.Auth;
using OrderChina.Shared.Infrastructure.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddSharedInfrastructure(builder.Configuration, dataProtectionApplicationName: "OrderChina.Admin");
builder.Services.AddOrderChinaJwtAuthentication(builder.Configuration, audience: "orderchina-admin-api");

// Rate limit riêng cho /auth/login và /auth/refresh — chặn brute-force/credential-stuffing
// trước cả khi chạm tới Identity account lockout. Partition theo IP (KHÔNG dùng AddFixedWindowLimiter
// trực tiếp — helper đó tạo 1 bucket DUY NHẤT dùng chung cho MỌI client, 1 IP có thể làm cạn quota
// và khoá luôn người dùng khác).
builder.Services.AddRateLimiter(options =>
{
    options.AddPolicy("auth", httpContext => RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        }));
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

builder.Services.AddHealthChecks();

// CORS chỉ bật ở Development để 2 frontend chạy "npm run dev" (port riêng, khác origin) gọi được
// kèm cookie. Cho phép cả customer-web (3000, nơi đặt trang login dùng chung /login — form thử gọi
// CustomerApi rồi mới thử AdminApi) lẫn admin-web (3001). Production không cần vì Nginx đưa cả 2 về
// chung 1 origin (xem orderchina.conf).
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("dev-frontend", policy => policy
            .WithOrigins("http://localhost:3000", "http://localhost:3001")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
    });
}

var app = builder.Build();

// Nginx forward nguyên vẹn path gốc (vd "/admin/api/auth/login", xem deploy/nginx/conf.d/orderchina.conf)
// khi host chung 1 domain với CustomerApi theo path-prefix thay vì subdomain. UsePathBase strip prefix này
// cho routing nội bộ (controller vẫn khai [Route("auth")] như bình thường) nhưng vẫn giữ lại trong
// Request.PathBase để AuthController build đúng Cookie Path khớp với URL public. Rỗng ở Development
// (chạy trực tiếp không qua Nginx) nên không ảnh hưởng lúc dev/test cục bộ.
var pathBase = builder.Configuration["PathBase"];
if (!string.IsNullOrWhiteSpace(pathBase))
{
    app.UsePathBase(pathBase);
}

app.UseStaticFiles();
app.UseRouting();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors("dev-frontend");
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapControllers();
app.MapHealthChecks("/health");

app.Run();
