namespace OrderChina.Shared.Application.Warehouses.Dtos;

public record WarehouseDto(Guid Id, string Name, string Type);

public record WarehouseAdminListItem(
    Guid Id,
    string Name,
    string? Address,
    string Type,
    bool IsActive,
    DateTime CreatedAtUtc,
    string? CreatedByUsername,
    DateTime? UpdatedAtUtc,
    string? UpdatedByUsername);

public record SaveWarehouseRequest(string Name, string? Address, string Type, bool IsActive);

public record WarehouseAdminResult(bool Succeeded, string? Error, WarehouseAdminListItem? Item);
