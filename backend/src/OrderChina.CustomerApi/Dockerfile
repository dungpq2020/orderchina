FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY OrderChina.sln .
COPY src/OrderChina.Shared.Domain/OrderChina.Shared.Domain.csproj src/OrderChina.Shared.Domain/
COPY src/OrderChina.Shared.Application/OrderChina.Shared.Application.csproj src/OrderChina.Shared.Application/
COPY src/OrderChina.Shared.Infrastructure/OrderChina.Shared.Infrastructure.csproj src/OrderChina.Shared.Infrastructure/
COPY src/OrderChina.CustomerApi/OrderChina.CustomerApi.csproj src/OrderChina.CustomerApi/
RUN dotnet restore src/OrderChina.CustomerApi/OrderChina.CustomerApi.csproj

COPY src/OrderChina.Shared.Domain/ src/OrderChina.Shared.Domain/
COPY src/OrderChina.Shared.Application/ src/OrderChina.Shared.Application/
COPY src/OrderChina.Shared.Infrastructure/ src/OrderChina.Shared.Infrastructure/
COPY src/OrderChina.CustomerApi/ src/OrderChina.CustomerApi/

RUN dotnet publish src/OrderChina.CustomerApi/OrderChina.CustomerApi.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "OrderChina.CustomerApi.dll"]
