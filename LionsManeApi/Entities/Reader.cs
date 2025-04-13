using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace LionsManeApi.Entities;

public class Reader : IdentityUser<Guid>
{
    public ICollection<Folder> Folders { get; } = new List<Folder>();

    public ICollection<Feed> Feeds { get; } = new List<Feed>();

    public string AvatarURL { get; set; } = null!;
}

public class ReaderDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string AvatarURL { get; set; } = null!;
}