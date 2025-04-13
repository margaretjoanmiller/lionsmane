using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace LionsManeApi.Entities;

[Index(nameof(ReaderId), nameof(Name), IsUnique = true)]
public class Folder
{
    public Guid ID { get; set; }
    public Guid ReaderId { get; set; }
    [Required]
    public string? Name { get; set; }

    public ICollection<Feed> Feeds { get; } = new List<Feed>();
    public string[]? Tags { get; set; }
}

public class FolderInputDto
{
    
    public string? Name { get; set; }
    public List<Guid> Feeds { get; set; }
    public string[]? Tags { get; set; }
}

public class FolderOutDto
{
    public Guid ID { get; set; }
    public string Name { get; set; } = null!;
   public ICollection<FeedOutDto> Feeds { get; set; } = new List<FeedOutDto>();
    public string[]? Tags { get; set; } 
}