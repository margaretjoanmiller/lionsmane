namespace LionsManeApi.Interfaces;

public interface IArticleFetcher
{
    public Task FetchArticles();

    public Task FetchArticlesForFeed(Guid feedId);

    public Task FetchArticlesForFeed(Guid feedId, int count);

    public Task FetchArticlesForUser(Guid userId);

    public Task FetchArticlesForUser(Guid userId, int count);

}