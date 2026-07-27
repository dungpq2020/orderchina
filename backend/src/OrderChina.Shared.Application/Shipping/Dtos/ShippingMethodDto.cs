namespace OrderChina.Shared.Application.Shipping.Dtos;

public record ShippingMethodDto(Guid Id, string Name);

public record ShippingMethodAdminListItem(
    Guid Id,
    string Name,
    bool IsActive,
    DateTime CreatedAtUtc,
    string? CreatedByUsername,
    DateTime? UpdatedAtUtc,
    string? UpdatedByUsername);

public record SaveShippingMethodRequest(string Name, bool IsActive);

public record ShippingMethodAdminResult(bool Succeeded, string? Error, ShippingMethodAdminListItem? Item);
