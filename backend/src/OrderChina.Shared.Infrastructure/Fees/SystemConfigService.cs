using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Fees;
using OrderChina.Shared.Application.Fees.Dtos;
using OrderChina.Shared.Domain.Fees;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.Shared.Infrastructure.Fees;

public class SystemConfigService : ISystemConfigService
{
    private readonly AppDbContext _dbContext;

    public SystemConfigService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<SystemConfigDto> GetAsync(CancellationToken cancellationToken = default)
    {
        var entity = await GetOrCreateEntityAsync(cancellationToken);
        return await MapToDtoAsync(entity, cancellationToken);
    }

    public async Task<SystemConfigResult> UpdateAsync(UpdateSystemConfigRequest request, Guid actingUserId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.WebsiteName))
        {
            return new SystemConfigResult(false, "Vui lòng nhập tên website.", null);
        }

        if (request.VolumetricWeightDivisor <= 0)
        {
            return new SystemConfigResult(false, "Số chia cân quy đổi phải lớn hơn 0.", null);
        }

        var entity = await GetOrCreateEntityAsync(cancellationToken);

        entity.WebsiteName = request.WebsiteName;
        entity.Address = request.Address;
        entity.PhoneNumber = request.PhoneNumber;
        entity.ContactEmail = request.ContactEmail;
        entity.ChromeToolUrl = request.ChromeToolUrl;
        entity.PurchaseExchangeRate = request.PurchaseExchangeRate;
        entity.ConsignmentExchangeRate = request.ConsignmentExchangeRate;
        entity.PaymentExchangeRate = request.PaymentExchangeRate;
        entity.MinPurchaseFee = request.MinPurchaseFee;
        entity.PurchaseInsurancePercent = request.PurchaseInsurancePercent;
        entity.MaxLinksPerOrder = request.MaxLinksPerOrder;
        entity.CartAutoDeleteDays = request.CartAutoDeleteDays;
        entity.SalesCommissionPurchasePercent = request.SalesCommissionPurchasePercent;
        entity.PurchasingStaffCommissionPurchasePercent = request.PurchasingStaffCommissionPurchasePercent;
        entity.SalesCommissionConsignmentPercent = request.SalesCommissionConsignmentPercent;
        entity.SalesCommissionPaymentPercent = request.SalesCommissionPaymentPercent;
        entity.VolumetricWeightDivisor = request.VolumetricWeightDivisor;
        entity.UpdatedAtUtc = DateTime.UtcNow;
        entity.UpdatedByUserId = actingUserId;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var dto = await MapToDtoAsync(entity, cancellationToken);
        return new SystemConfigResult(true, null, dto);
    }

    private async Task<SystemConfig> GetOrCreateEntityAsync(CancellationToken cancellationToken)
    {
        var entity = await _dbContext.SystemConfigs.FirstOrDefaultAsync(cancellationToken);
        if (entity is not null)
        {
            return entity;
        }

        entity = new SystemConfig
        {
            Id = Guid.NewGuid(),
            WebsiteName = "OrderChina",
            CreatedAtUtc = DateTime.UtcNow,
        };

        _dbContext.SystemConfigs.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return entity;
    }

    private async Task<SystemConfigDto> MapToDtoAsync(SystemConfig entity, CancellationToken cancellationToken)
    {
        string? updatedByUsername = entity.UpdatedByUserId is { } updatedById
            ? await _dbContext.Users.Where(u => u.Id == updatedById).Select(u => u.UserName).FirstOrDefaultAsync(cancellationToken)
            : null;

        return new SystemConfigDto(
            entity.Id,
            entity.WebsiteName,
            entity.Address,
            entity.PhoneNumber,
            entity.ContactEmail,
            entity.ChromeToolUrl,
            entity.PurchaseExchangeRate,
            entity.ConsignmentExchangeRate,
            entity.PaymentExchangeRate,
            entity.MinPurchaseFee,
            entity.PurchaseInsurancePercent,
            entity.MaxLinksPerOrder,
            entity.CartAutoDeleteDays,
            entity.SalesCommissionPurchasePercent,
            entity.PurchasingStaffCommissionPurchasePercent,
            entity.SalesCommissionConsignmentPercent,
            entity.SalesCommissionPaymentPercent,
            entity.VolumetricWeightDivisor,
            entity.UpdatedAtUtc,
            updatedByUsername);
    }
}
