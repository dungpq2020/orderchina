using OrderChina.Shared.Application.Fees.Dtos;

namespace OrderChina.Shared.Application.Fees;

public interface IUserLevelService
{
    Task<IReadOnlyList<UserLevelListItem>> GetListAsync(CancellationToken cancellationToken = default);

    Task<UserLevelResult> CreateAsync(CreateUserLevelRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<UserLevelResult> UpdateAsync(Guid id, UpdateUserLevelRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(Guid id, Guid actingUserId, CancellationToken cancellationToken = default);
}
