namespace OrderChina.Shared.Application.Users.Dtos;

public record CustomerListItem(
    Guid Id,
    string Username,
    string? Email,
    string? PhoneNumber,
    string FullName,
    DateTime CreatedAtUtc);

public record CustomerListResult(IReadOnlyList<CustomerListItem> Items, int TotalCount, int Page, int PageSize);
