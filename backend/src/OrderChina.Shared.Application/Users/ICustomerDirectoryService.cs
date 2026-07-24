using OrderChina.Shared.Application.Users.Dtos;

namespace OrderChina.Shared.Application.Users;

public interface ICustomerDirectoryService
{
    Task<CustomerListResult> GetCustomersAsync(int page, int pageSize, CancellationToken cancellationToken = default);
}
