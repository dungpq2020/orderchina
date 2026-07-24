using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Users;
using OrderChina.Shared.Application.Users.Dtos;
using OrderChina.Shared.Domain.Identity;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.Shared.Infrastructure.Users;

public class CustomerDirectoryService : ICustomerDirectoryService
{
    private readonly AppDbContext _dbContext;

    public CustomerDirectoryService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CustomerListResult> GetCustomersAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 20 : pageSize;

        var query = _dbContext.Users
            .AsNoTracking()
            .Where(u => u.UserType == UserType.Customer);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(u => u.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new CustomerListItem(
                u.Id,
                u.UserName!,
                u.Email,
                u.PhoneNumber,
                u.FullName,
                u.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return new CustomerListResult(items, totalCount, page, pageSize);
    }
}
