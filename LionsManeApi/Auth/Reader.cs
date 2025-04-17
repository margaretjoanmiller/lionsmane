using LionsManeApi.Feeds;
using LionsManeApi.Folders;
using Microsoft.AspNetCore.Identity;

namespace LionsManeApi.Auth;

public class Reader : IdentityUser<Guid>
{
    public ICollection<Folder> Folders { get; } = new List<Folder>();

    public ICollection<Feed> Feeds { get; } = new List<Feed>();

    public string? AvatarURL { get; set; }
}

public class ReaderDto
{
    public required string Name { get; set; }
    public required string Email { get; set; }
    public string? AvatarURL { get; set; }
}