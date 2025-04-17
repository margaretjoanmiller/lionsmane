using System.ComponentModel.DataAnnotations;
using LionsManeApi.Auth;
using LionsManeApi.Feeds;
using Microsoft.EntityFrameworkCore;

namespace LionsManeApi.Folders;

[Index(nameof(ReaderId), nameof(Name), IsUnique = true)]
public class Folder
{
    public Guid Id { get; set; }
    public required Guid ReaderId { get; set; }
    public required Reader Reader { get; set; }
    public required string Name { get; set; }

    public ICollection<Feed>? Feeds { get; } = new List<Feed>();
    public string[]? Tags { get; set; }
}

public class FolderInputDto
{
    
    public required string Name { get; set; }
    public required List<Guid> Feeds { get; set; }
    public string[]? Tags { get; set; }
}

public class FolderOutDto
{
    public required Guid Id { get; set; }
    public required string Name { get; set; } = null!;
    public required ICollection<FeedOutDto> Feeds { get; set; } = new List<FeedOutDto>();
    public string[]? Tags { get; set; } 
}