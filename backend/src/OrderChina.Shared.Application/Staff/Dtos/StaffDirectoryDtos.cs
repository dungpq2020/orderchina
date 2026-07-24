namespace OrderChina.Shared.Application.Staff.Dtos;

public record StaffDirectoryListItem(
    Guid Id,
    string Username,
    string? Email,
    string? PhoneNumber,
    string FullName,
    int Role,
    int Status,
    DateTime CreatedAtUtc);

public record StaffDirectoryListResult(IReadOnlyList<StaffDirectoryListItem> Items, int TotalCount, int Page, int PageSize);

public record UpdateStaffRequest(
    string FullName,
    string? Email,
    string? PhoneNumber,
    string? NewPassword,
    int Status,
    int Role);

public record UpdateStaffResult(bool Succeeded, string? Error, StaffDirectoryListItem? Staff);
