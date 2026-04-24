using System.Net.Http.Json;
using FluentAssertions;
using Xunit;

namespace MedManager.Api.Tests;

public class HealthTests(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    [Fact]
    public async Task Health_returns_ok()
    {
        var client = factory.CreateClient();
        var response = await client.GetAsync("/health");
        response.EnsureSuccessStatusCode();

        var body = await response.Content.ReadFromJsonAsync<HealthResponseDto>();
        body.Should().NotBeNull();
        body!.Ok.Should().BeTrue();
    }

    private record HealthResponseDto(bool Ok, string Version);
}
