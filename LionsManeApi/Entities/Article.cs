using System.ComponentModel.DataAnnotations;
using NodaTime;

namespace LionsManeApi.Entities;

public class Article
{
    public Guid ID { get; set; }
    [Required]
    public Guid FeedId { get; set; }
    [Required]
    public string? Title { get; set; }
    [Required]
    public string[]? Authors { get; set; }
    [Required]
    public Uri[]? Links { get; set; }
    [Required]
    public string? Description { get; set; }
    public string? Content { get; set; }
    public Uri? FeaturedImage { get; set; }
    public string? FeaturedImageAlt { get; set; }
    public bool IsRead { get; set; } = false;
    [Required]
    public Instant Published { get; set; }
}
