using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using MedManager.Api.Features.Auth;
using Xunit;

namespace MedManager.Api.Tests;

public class AuthTests(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    private HttpClient NewClient() =>
        factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true,
        });

    [Fact]
    public async Task Register_creates_user_and_returns_tokens()
    {
        var client = NewClient();

        var res = await client.PostAsJsonAsync("/auth/register", new
        {
            email = $"r{Guid.NewGuid():N}@example.com",
            password = "password123",
            locale = "tr",
        });

        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await res.Content.ReadFromJsonAsync<AuthResponse>();
        body.Should().NotBeNull();
        body!.AccessToken.Should().NotBeNullOrEmpty();
        body.User.Locale.Should().Be("tr");

        res.Headers.TryGetValues("Set-Cookie", out var cookies).Should().BeTrue();
        cookies!.Should().Contain(c => c.Contains("medmanager.rt="));
    }

    [Fact]
    public async Task Register_rejects_duplicate_email()
    {
        var client = NewClient();
        var email = $"d{Guid.NewGuid():N}@example.com";

        (await client.PostAsJsonAsync("/auth/register",
            new { email, password = "password123", locale = "tr" }))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        var second = await client.PostAsJsonAsync("/auth/register",
            new { email, password = "password123", locale = "tr" });
        second.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Register_rejects_short_password()
    {
        var client = NewClient();
        var res = await client.PostAsJsonAsync("/auth/register",
            new { email = "short@example.com", password = "short", locale = "tr" });
        res.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_succeeds_with_valid_credentials()
    {
        var client = NewClient();
        var email = $"l{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/auth/register",
            new { email, password = "password123", locale = "tr" });

        var res = await client.PostAsJsonAsync("/auth/login",
            new { email, password = "password123" });

        res.StatusCode.Should().Be(HttpStatusCode.OK);
        (await res.Content.ReadFromJsonAsync<AuthResponse>())!.AccessToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_returns_401_on_bad_password()
    {
        var client = NewClient();
        var email = $"b{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/auth/register",
            new { email, password = "password123", locale = "tr" });

        var res = await client.PostAsJsonAsync("/auth/login",
            new { email, password = "wrong-password" });
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_requires_authentication()
    {
        var client = NewClient();
        var res = await client.GetAsync("/me");
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Me_returns_profile_with_access_token()
    {
        var client = NewClient();
        var email = $"m{Guid.NewGuid():N}@example.com";
        var regRes = await client.PostAsJsonAsync("/auth/register",
            new { email, password = "password123", locale = "tr" });
        var auth = await regRes.Content.ReadFromJsonAsync<AuthResponse>();

        var request = new HttpRequestMessage(HttpMethod.Get, "/me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);
        var res = await client.SendAsync(request);

        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var me = await res.Content.ReadFromJsonAsync<MeDto>();
        me!.Email.Should().Be(email);
        me.Locale.Should().Be("tr");
    }

    [Fact]
    public async Task Refresh_rotates_tokens()
    {
        var client = NewClient();
        var email = $"rf{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/auth/register",
            new { email, password = "password123", locale = "tr" });

        var res = await client.PostAsync("/auth/refresh", content: null);
        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await res.Content.ReadFromJsonAsync<AuthResponse>();
        body!.AccessToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Refresh_without_cookie_returns_401()
    {
        var client = NewClient();
        var res = await client.PostAsync("/auth/refresh", content: null);
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Update_me_changes_locale()
    {
        var client = NewClient();
        var email = $"u{Guid.NewGuid():N}@example.com";
        var regRes = await client.PostAsJsonAsync("/auth/register",
            new { email, password = "password123", locale = "tr" });
        var auth = await regRes.Content.ReadFromJsonAsync<AuthResponse>();

        var request = new HttpRequestMessage(HttpMethod.Patch, "/me")
        {
            Content = JsonContent.Create(new { locale = "en" }),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);
        var res = await client.SendAsync(request);

        res.StatusCode.Should().Be(HttpStatusCode.OK);
        var me = await res.Content.ReadFromJsonAsync<MeDto>();
        me!.Locale.Should().Be("en");
    }
}
