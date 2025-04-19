using System.ServiceModel.Syndication;
using System.Xml;
using LionsManeApi.Interfaces;
using NodaTime.Extensions;
using SmartReader;
using UUIDNext;

namespace LionsManeApi.Services;

public class ArticleFetcherService : IArticleFetcher
{
    private readonly TomeContext _context;
    private readonly ILogger<ArticleFetcherService> _logger;

    public ArticleFetcherService(TomeContext context, ILogger<ArticleFetcherService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task FetchArticles()
    {
        throw new NotImplementedException();
    }

    public async Task FetchArticlesForFeed(Guid id)
    {
        var feed = await _context.Feeds.FindAsync(id);

        if (feed is null) throw new KeyNotFoundException();

        using var reader = XmlReader.Create(feed.Url.ToString());
        var feedData = SyndicationFeed.Load(reader);
        var articles = from item in feedData.Items
            where item.PublishDate.ToInstant() > feed.LastUpdated
            select item;

        foreach (var article in articles)
        {
            var artContent = "";
            Uri featuredImage;
            var featuredImageAlt = "";
            try
            {
                if (article.Links.Count == 0) throw new Exception();

                var artParsed = await ParseArticle(article.Links.First().Uri.ToString());
                var articleImages = await artParsed.GetImagesAsync();
                if (artParsed.FeaturedImage is null && articleImages.Count > 0)
                {
                    featuredImage = articleImages[0].Source;
                    featuredImageAlt = articleImages[0].Description;
                }
                else
                {
                    featuredImage = new Uri(artParsed.FeaturedImage);
                    featuredImageAlt = articleImages.FirstOrDefault()?.Description ?? "No alt text found";
                }

                artContent = artParsed.Content;
            }
            catch (Exception e)
            {
                _logger.LogError(e, "Failed to parse article content");
                throw new Exception("Failed to parse article content");
            }

            var newArticle = new Articles.Article
            {
                Id = Uuid.NewDatabaseFriendly(Database.PostgreSql),
                FeedId = id,
                Authors = article.Authors.Select(x => x.Name).ToArray(),
                Title = article.Title.Text,
                Links = article.Links.Select(x => x.Uri).ToArray(),
                Description = article.Summary.Text,
                Content = artContent,
                IsRead = false,
                FeaturedImage = featuredImage,
                FeaturedImageAlt = featuredImageAlt,
                Published = article.PublishDate.ToInstant()
            };
            _context.Articles.Add(newArticle);
            feed.LastUpdated = newArticle.Published;
            _context.Feeds.Update(feed);
            await _context.SaveChangesAsync();
        }
    }

    public async Task FetchArticlesForFeed(Guid id, int count)
    {
        var feed = await _context.Feeds.FindAsync(id);

        if (feed is null) throw new KeyNotFoundException();

        using var reader = XmlReader.Create(feed.Url.ToString());
        var feedData = SyndicationFeed.Load(reader);
        var articles = (from item in feedData.Items
            where item.PublishDate.ToInstant() > feed.LastUpdated
            select item).Take(count);

        foreach (var article in articles)
        {
            var newArticle = new Articles.Article
            {
                Id = Uuid.NewDatabaseFriendly(Database.PostgreSql),
                FeedId = id,
                Title = article.Title.Text,
                Authors = article.Authors.Select(x => x.Name).ToArray(),
                Links = article.Links.Select(x => x.Uri).ToArray(),
                Description = article.Summary.Text,
                Published = article.PublishDate.ToInstant()
            };
            _context.Articles.Add(newArticle);
            await _context.SaveChangesAsync();
        }
    }

    public async Task FetchArticlesForUser(Guid id)
    {
        var feeds = _context.Feeds.Where(x => x.ReaderId == id).ToList();

        foreach (var feed in feeds) await FetchArticlesForFeed(feed.Id);
    }

    public async Task FetchArticlesForUser(Guid id, int count)
    {
        var feeds = _context.Feeds.Where(x => x.ReaderId == id).ToList();

        foreach (var feed in feeds) await FetchArticlesForFeed(feed.Id, count);
    }

    public async Task<Article> ParseArticle(string url)
    {
        var sr = new Reader(url);
        var article = await sr.GetArticleAsync();
        return article;
    }
}