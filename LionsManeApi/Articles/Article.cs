using System.ComponentModel.DataAnnotations;
using NodaTime;

namespace LionsManeApi.Articles;

public class Article
{
    public Guid Id { get; set; }
    public required Guid FeedId { get; set; }
    public required string Title { get; set; }
    public string[]? Authors { get; set; }
    public Uri[]? Links { get; set; }
    public string? Description { get; set; }
    public string? Content { get; set; }
    public Uri? FeaturedImage { get; set; }
    public string? FeaturedImageAlt { get; set; }
    public bool IsRead { get; set; } = false;
    public required Instant Published { get; set; }
}
