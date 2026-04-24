# syntax=docker/dockerfile:1.7
ARG DOTNET_VERSION=10.0

FROM mcr.microsoft.com/dotnet/sdk:${DOTNET_VERSION} AS build
WORKDIR /src

COPY MedManager.sln ./
COPY MedManager.Api/MedManager.Api.csproj MedManager.Api/
COPY MedManager.Api.Tests/MedManager.Api.Tests.csproj MedManager.Api.Tests/
RUN dotnet restore MedManager.sln

COPY . .
RUN dotnet publish MedManager.Api/MedManager.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:${DOTNET_VERSION} AS runtime
WORKDIR /app

RUN useradd -u 10001 -r -s /sbin/nologin medmanager && \
    mkdir -p /data && chown -R medmanager:medmanager /data

USER medmanager

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    ConnectionStrings__Default="Data Source=/data/medmanager.db"

EXPOSE 8080

COPY --from=build --chown=medmanager:medmanager /app/publish ./

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/health || exit 1

ENTRYPOINT ["dotnet", "MedManager.Api.dll"]
