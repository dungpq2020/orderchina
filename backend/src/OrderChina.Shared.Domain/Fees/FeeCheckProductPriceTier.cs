namespace OrderChina.Shared.Domain.Fees;

/// <summary>Bậc giá sản phẩm (theo NDT) áp dụng mức phí kiểm hàng tương ứng.</summary>
public enum FeeCheckProductPriceTier
{
    LessThan10Yuan = 1,
    GreaterThan10Yuan = 2
}
