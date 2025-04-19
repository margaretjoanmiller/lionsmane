using System.Security.Claims;
using FastEndpoints;
using LionsManeApi.Interfaces;
using NodaTime;
using UUIDNext;

namespace LionsManeApi.Feeds.Endpoints.CRUD;

public class AddFeed: Endpoint<FeedInputDto, FeedOutDto>
{
    public required TomeContext TomeContext { get; set; }
    
   public override void Configure()
   {
      Post("/api/feeds/add");
   }

   public override async Task HandleAsync(FeedInputDto dto, CancellationToken ct)
   {
       var threeWeeksAgo = SystemClock.Instance.GetCurrentInstant().Minus(Duration.FromDays(21));
       var outFeed = new FeedOutDto()
       {
           Id = Uuid.NewDatabaseFriendly(Database.PostgreSql),
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
           Logger.LogInformation("Adding feed {Title} to database", feed.Title);
           TomeContext.Feeds.Add(feed);
           await TomeContext.SaveChangesAsync();
       }
       catch(Exception)
       {
         Logger.LogError("Failed to add feed {Title} to database", feed.Title); 
       }

       await SendAsync(outFeed);
   }
}