using NodaTime;
using FastEndpoints;
using LionsManeApi.Interfaces;

namespace LionsManeApi.Feeds.Endpoints.Sync;

public class RefreshReq
{
    public required string FeedId { get; set; }
    public Instant RefreshFromDate { get; set; }
}

public class RefreshStatus
{
    public required string FeedId { get; set; }
    public required string Status { get; set; }
}

public class RequestRefresh : Endpoint<RefreshReq, RefreshStatus>
{
   public required IArticleFetcher ArticleFetcher { get; set; }
   public required TomeContext TomeContext { get; set; }

   public override void Configure()
   {
       Post("/feeds/sync/refresh");
   }

   public override async Task HandleAsync(RefreshReq req, CancellationToken ct)
   {
       var status = "refreshing";

       var feedToRfresh = await TomeContext.Feeds.FindAsync(req.FeedId, ct);

       if (feedToRfresh is null)
       {
           status = "failed to find feed";
           await SendAsync(new RefreshStatus()
           {
               FeedId = req.FeedId,
               Status = status,
           }, 404);
       }
       else
       {
           await ArticleFetcher.FetchArticlesForFeed(new Guid(req.FeedId));
           await SendAsync(new RefreshStatus()
           {
               FeedId = req.FeedId,
               Status = status,
           });
       }
       
   }
}