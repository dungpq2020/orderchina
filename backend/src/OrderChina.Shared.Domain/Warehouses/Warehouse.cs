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

    public WarehouseType Type { get; set; }

    public bool IsActive { get; set; } = true;
}
