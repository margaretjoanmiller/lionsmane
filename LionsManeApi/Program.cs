using FastEndpoints;
using FastEndpoints.Security;
using FastEndpoints.Swagger;
using LionsManeApi;
using LionsManeApi.Auth;
using LionsManeApi.Interfaces;
using LionsManeApi.Services;
using Microsoft.EntityFrameworkCore;

var bld = WebApplication.CreateBuilder();
bld.Logging.ClearProviders();
bld.Logging.AddConsole();

// Database setup
bld.Services.AddDbContext<TomeContext>(opt =>
    opt.UseNpgsql(bld.Configuration.GetConnectionString("TomeContext"),
            o => o.UseNodaTime()
    ));

// Core Identity setup
bld.Services.AddAuthenticationJwtBearer(s =>
    s.SigningKey = bld.Configuration.GetSection("JWT").GetSection("Key").Value);
bld.Services.AddAuthorization();

bld.Services.AddIdentityApiEndpoints<Reader>()
    .AddEntityFrameworkStores<TomeContext>();

// Application setup
bld.Services.AddScoped<IArticleFetcher, ArticleFetcherService>();

bld.Services.AddFastEndpoints()
    .SwaggerDocument();

var app = bld.Build();

app.MapIdentityApi<Reader>();
app.UseAuthentication()
    .UseAuthorization();

app.UseFastEndpoints();

//only make swaggerui available in development
if (app.Environment.IsDevelopment())
{
    app.UseSwaggerGen();
}

app.Run();