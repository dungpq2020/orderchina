namespace OrderChina.Shared.Domain.Warehouses;

public enum WarehouseType
{
    China = 1,
    Vietnam = 2
}

public class Warehouse
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Address { get; set; }

    public WarehouseType Type { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Guid? CreatedByUserId { get; set; }

    public DateTime? UpdatedAtUtc { get; set; }

    public Guid? UpdatedByUserId { get; set; }
}
