using FluentValidation;
using OrderChina.Shared.Application.Users.Dtos;

namespace OrderChina.Shared.Application.Users.Validators;

public class UpdateMyProfileRequestValidator : AbstractValidator<UpdateMyProfileRequest>
{
    public UpdateMyProfileRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(256);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Vui lòng nhập số điện thoại.")
            .Matches(@"^(0|\+84)[0-9]{9,10}$").WithMessage("Số điện thoại không hợp lệ.");
        RuleFor(x => x.Address).MaximumLength(500);
    }
}
