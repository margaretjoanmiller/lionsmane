using FastEndpoints;
using Microsoft.EntityFrameworkCore;

namespace LionsManeApi.Feeds.Endpoints.CRUD;


sealed class UpdateFeedEndpoint() : Endpoint<FeedInputDto, FeedOutDto>
{
    public required TomeContext TomeContext { get; set; }
    public override void Configure()
    {
        Patch("/feeds/update");
    }

    public override async Task HandleAsync(FeedInputDto r, CancellationToken c)
    {
        var feed = await TomeContext.Feeds.SingleAsync(f => f.Url == r.Url);
        feed.Title = r.Title;
        feed.Url = r.Url;
        feed.Tags = r.Tags;
        await TomeContext.SaveChangesAsync(c);
    }
}