namespace OrderChina.Shared.Application.Staff.Dtos;

public record StaffDirectoryListItem(
    Guid Id,
    string Username,
    string? Email,
    string? PhoneNumber,
    string FullName,
    string? Address,
    int Role,
    int Status,
    decimal WalletBalance,
    DateTime CreatedAtUtc,
    string? CreatedByUsername,
    DateTime? UpdatedAtUtc,
    string? UpdatedByUsername);

public record StaffDirectoryListResult(IReadOnlyList<StaffDirectoryListItem> Items, int TotalCount, int Page, int PageSize);

public record UpdateStaffRequest(
    string FullName,
    string? Email,
    string? PhoneNumber,
    string? Address,
    string? NewPassword,
    int Status,
    int Role);

public record UpdateStaffResult(bool Succeeded, string? Error, StaffDirectoryListItem? Staff);
