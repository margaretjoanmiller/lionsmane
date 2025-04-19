using System.Security.Claims;
using FastEndpoints;
using LionsManeApi.Interfaces;
using NodaTime;

namespace LionsManeApi.Feeds.Endpoints.CRUD;

public class AddFeed: Endpoint<FeedInputDto, FeedOutDto>
{
    public required IArticleFetcher ArticleFetcher { get; set; }
    public required TomeContext TomeContext { get; set; }
    
    public required ILogger Logger { get; set; }
    
   public override void Configure()
   {
      Post("/api/feed/add");
   }

   public override async Task HandleAsync(FeedInputDto dto, CancellationToken ct)
   {
       var threeWeeksAgo = SystemClock.Instance.GetCurrentInstant().Minus(Duration.FromDays(14));
       var outFeed = new FeedOutDto()
       {
           Title = dto.Title,
           Url = dto.Url,
           LastUpdated = threeWeeksAgo.ToString(),
       };

       var currentReader =
           await TomeContext.Users.FindAsync(new Guid(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value!))!;
       if (currentReader is null)
       {
           throw new UnauthorizedAccessException();
       }
       var feed = new Feed()
       {
           Title = dto.Title,
           Url = dto.Url,
           LastUpdated = threeWeeksAgo,
           ReaderId = new Guid(HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value!),
           Reader = currentReader
       };
       try
       {
           Logger;
           TomeContext.Feeds.Add(feed);
           await TomeContext.SaveChangesAsync();
       }
       catch(Exception)
       {
          
       }

       await SendAsync(outFeed);
   }
}