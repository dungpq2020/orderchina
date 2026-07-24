namespace OrderChina.Shared.Domain.Shipping;

public class ShippingMethod
{
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}
