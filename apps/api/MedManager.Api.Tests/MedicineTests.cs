using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;
using MedManager.Api.Features.Auth;
using MedManager.Api.Features.Medicines;
using MedManager.Api.Features.Medicines.List;
using MedManager.Api.Features.UseCases.List;
using Xunit;

namespace MedManager.Api.Tests;

public class MedicineTests(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    private HttpClient NewClient() =>
        factory.CreateClient(new Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactoryClientOptions
        {
            HandleCookies = true,
        });

    private async Task<(HttpClient client, string token)> Authenticated()
    {
        var client = NewClient();
        var email = $"m{Guid.NewGuid():N}@example.com";
        var res = await client.PostAsJsonAsync("/auth/register",
            new { email, password = "password123", locale = "tr" });
        var auth = await res.Content.ReadFromJsonAsync<AuthResponse>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.AccessToken);
        return (client, auth.AccessToken);
    }

    [Fact]
    public async Task UseCases_list_is_seeded_and_localized()
    {
        var client = NewClient();
        client.DefaultRequestHeaders.AcceptLanguage.ParseAdd("tr");
        var res = await client.GetAsync("/use-cases");
        res.EnsureSuccessStatusCode();
        var items = await res.Content.ReadFromJsonAsync<List<UseCaseDto>>();
        items.Should().NotBeNull();
        items!.Should().HaveCountGreaterThan(30);
        items.Should().Contain(u => u.Slug == "headache" && u.Name == "Baş ağrısı");
    }

    [Fact]
    public async Task UseCases_return_english_when_requested()
    {
        var client = NewClient();
        client.DefaultRequestHeaders.AcceptLanguage.Clear();
        client.DefaultRequestHeaders.AcceptLanguage.ParseAdd("en");
        var res = await client.GetAsync("/use-cases");
        var items = await res.Content.ReadFromJsonAsync<List<UseCaseDto>>();
        items!.Should().Contain(u => u.Slug == "headache" && u.Name == "Headache");
    }

    [Fact]
    public async Task Create_medicine_returns_201_and_persists()
    {
        var (client, _) = await Authenticated();
        var ucRes = await client.GetAsync("/use-cases");
        var uc = (await ucRes.Content.ReadFromJsonAsync<List<UseCaseDto>>())!.First(u => u.Slug == "fever");

        var body = new
        {
            name = "Paracetamol",
            activeIngredient = "paracetamol",
            strength = "500mg",
            form = "tablet",
            expiryDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(6)).ToString("yyyy-MM-dd"),
            quantity = 20m,
            unit = "tablet",
            useCaseIds = new[] { uc.Id },
        };
        var res = await client.PostAsJsonAsync("/medicines", body);
        res.StatusCode.Should().Be(HttpStatusCode.Created);
        var dto = await res.Content.ReadFromJsonAsync<MedicineDto>();
        dto!.Name.Should().Be("Paracetamol");
        dto.UseCases.Should().Contain(u => u.Slug == "fever");
        dto.IsExpired.Should().BeFalse();
    }

    [Fact]
    public async Task List_only_returns_own_medicines()
    {
        var (clientA, _) = await Authenticated();
        var (clientB, _) = await Authenticated();

        await clientA.PostAsJsonAsync("/medicines", new
        {
            name = "OnlyMine",
            expiryDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(3)).ToString("yyyy-MM-dd"),
            quantity = 1m,
            unit = "unit",
        });

        var listB = await clientB.GetAsync("/medicines");
        var body = await listB.Content.ReadFromJsonAsync<ListMedicinesResponse>();
        body!.Items.Should().NotContain(m => m.Name == "OnlyMine");
    }

    [Fact]
    public async Task Open_lid_computes_effective_expiry()
    {
        var (client, _) = await Authenticated();
        var exp = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(1));
        var createRes = await client.PostAsJsonAsync("/medicines", new
        {
            name = "Syrup",
            expiryDate = exp.ToString("yyyy-MM-dd"),
            quantity = 1m,
            unit = "bottle",
            openedShelfLifeDays = 30,
        });
        var created = await createRes.Content.ReadFromJsonAsync<MedicineDto>();

        var openRes = await client.PostAsJsonAsync($"/medicines/{created!.Id}/open", new { openedShelfLifeDays = 30 });
        var opened = await openRes.Content.ReadFromJsonAsync<MedicineDto>();
        opened!.IsOpened.Should().BeTrue();
        opened.EffectiveExpiry.Should().BeBefore(exp);
    }

    [Fact]
    public async Task Update_can_replace_use_cases()
    {
        var (client, _) = await Authenticated();
        var ucs = await (await client.GetAsync("/use-cases")).Content.ReadFromJsonAsync<List<UseCaseDto>>();
        var fever = ucs!.First(u => u.Slug == "fever");
        var cough = ucs.First(u => u.Slug == "cough");

        var created = await (await client.PostAsJsonAsync("/medicines", new
        {
            name = "M",
            expiryDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(3)).ToString("yyyy-MM-dd"),
            quantity = 1m,
            unit = "u",
            useCaseIds = new[] { fever.Id },
        })).Content.ReadFromJsonAsync<MedicineDto>();

        var patch = new HttpRequestMessage(HttpMethod.Patch, $"/medicines/{created!.Id}")
        {
            Content = JsonContent.Create(new { useCaseIds = new[] { cough.Id } }),
        };
        var updated = await (await client.SendAsync(patch)).Content.ReadFromJsonAsync<MedicineDto>();
        updated!.UseCases.Should().HaveCount(1);
        updated.UseCases[0].Slug.Should().Be("cough");
    }

    [Fact]
    public async Task Delete_removes_medicine()
    {
        var (client, _) = await Authenticated();
        var created = await (await client.PostAsJsonAsync("/medicines", new
        {
            name = "ToDelete",
            expiryDate = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(3)).ToString("yyyy-MM-dd"),
            quantity = 1m,
            unit = "u",
        })).Content.ReadFromJsonAsync<MedicineDto>();

        var del = await client.DeleteAsync($"/medicines/{created!.Id}");
        del.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var get = await client.GetAsync($"/medicines/{created.Id}");
        get.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Medicines_require_authentication()
    {
        var client = NewClient();
        var res = await client.GetAsync("/medicines");
        res.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
