using System.ComponentModel.DataAnnotations;
using LionsManeApi.Articles;
using LionsManeApi.Auth;
using LionsManeApi.Folders;
using NodaTime;

namespace LionsManeApi.Feeds;

public class Feed
{
    public Guid Id { get; set; }
    public required Guid ReaderId { get; set; }
    public required Reader Reader { get; set; }
    public required string Title { get; set; }
    public required Uri Url { get; set; }
    public Uri? Favicon { get; set; }
    public string[]? Tags { get; set; }
    public Guid? FolderId { get; set; }
    public Folder? Folder { get; set; }
    public ICollection<Article> Articles { get; } = new List<Article>();
    public required Instant LastUpdated { get; set; }
}

public class FeedInputDto
{
    public required string Title { get; set; }
    public required Uri Url { get; set; }
    public string[]? Tags { get; set; }
}

public class FeedOutDto
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public required Uri Url { get; set; }
    public Uri? Favicon { get; set; }
    public string[]? Tags { get; set; }
    public Guid? FolderId { get; set; }
    public required String LastUpdated { get; set; }
    public ICollection<Article>? Articles { get; set; }
}