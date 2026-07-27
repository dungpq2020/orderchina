using OrderChina.Shared.Application.Fees.Dtos;

namespace OrderChina.Shared.Application.Fees;

public interface ISystemConfigService
{
    Task<SystemConfigDto> GetAsync(CancellationToken cancellationToken = default);

    Task<SystemConfigResult> UpdateAsync(UpdateSystemConfigRequest request, Guid actingUserId, CancellationToken cancellationToken = default);
}
