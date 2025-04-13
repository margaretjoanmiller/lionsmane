using System.ComponentModel.DataAnnotations;
using NodaTime;

namespace LionsManeApi.Entities;

public class Feed
{
    [Key]
    public Guid ID { get; set; }
    [Required]
    public Guid ReaderId { get; set; }
    [Required]
    public string? Title { get; set; }
    [Required]
    public Uri? Url { get; set; }
    public Uri? Favicon { get; set; }
    public string[]? Tags { get; set; }
    public Guid? FolderId { get; set; }
    public Folder? Folder { get; set; }
    public ICollection<Article> Articles { get; } = new List<Article>();
    public Instant LastUpdated { get; set; }
}

public class FeedInputDto
{
    [Required]
    public string? Title { get; set; }
    [Required]
    public Uri? Url { get; set; }
    public Uri? Favicon { get; set; }
    public string[]? Tags { get; set; }
}

public class FeedOutDto
{
    public Guid ID { get; set; }
    public string Title { get; set; } = null!;
    public Uri Url { get; set; } = null!;
    public Uri Favicon { get; set; } = null!;
    public string[]? Tags { get; set; }
    public Guid? FolderId { get; set; }
    public String LastUpdated { get; set; }
    public ICollection<Article> Articles { get; set; }
}