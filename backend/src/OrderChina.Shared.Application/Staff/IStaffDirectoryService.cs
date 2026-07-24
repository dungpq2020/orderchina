using OrderChina.Shared.Application.Staff.Dtos;

namespace OrderChina.Shared.Application.Staff;

public interface IStaffDirectoryService
{
    Task<IReadOnlyList<StaffListItem>> GetStaffAsync(CancellationToken cancellationToken = default);

    Task<StaffDirectoryListResult> GetStaffListAsync(int page, int pageSize, CancellationToken cancellationToken = default);

    Task<UpdateStaffResult> UpdateStaffAsync(Guid id, UpdateStaffRequest request, Guid actingUserId, CancellationToken cancellationToken = default);

    Task<StaffDirectoryListResult> GetAdminsAsync(int page, int pageSize, CancellationToken cancellationToken = default);

    Task<UpdateStaffResult> UpdateAdminAsync(Guid id, UpdateStaffRequest request, Guid actingUserId, CancellationToken cancellationToken = default);
}
