FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY OrderChina.sln .
COPY src/OrderChina.Shared.Domain/OrderChina.Shared.Domain.csproj src/OrderChina.Shared.Domain/
COPY src/OrderChina.Shared.Application/OrderChina.Shared.Application.csproj src/OrderChina.Shared.Application/
COPY src/OrderChina.Shared.Infrastructure/OrderChina.Shared.Infrastructure.csproj src/OrderChina.Shared.Infrastructure/
COPY src/OrderChina.Migrator/OrderChina.Migrator.csproj src/OrderChina.Migrator/
RUN dotnet restore src/OrderChina.Migrator/OrderChina.Migrator.csproj

COPY src/OrderChina.Shared.Domain/ src/OrderChina.Shared.Domain/
COPY src/OrderChina.Shared.Application/ src/OrderChina.Shared.Application/
COPY src/OrderChina.Shared.Infrastructure/ src/OrderChina.Shared.Infrastructure/
COPY src/OrderChina.Migrator/ src/OrderChina.Migrator/

RUN dotnet publish src/OrderChina.Migrator/OrderChina.Migrator.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "OrderChina.Migrator.dll"]
