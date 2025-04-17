using LionsManeApi.Articles;
using LionsManeApi.Auth;
using LionsManeApi.Feeds;
using LionsManeApi.Folders;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace LionsManeApi;

public class TomeContext(DbContextOptions<TomeContext> options)
    : IdentityDbContext<Reader, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<Article> Articles { get; set; }
    public DbSet<Feed> Feeds { get; set; }
    public DbSet<Folder> Folders { get; set; }
}