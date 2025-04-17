using FastEndpoints;
using NodaTime;

namespace LionsManeApi.Feeds.Endpoints.CRUD;

public class AddFeed: Endpoint<FeedInputDto, FeedOutDto>
{
   public override void Configure()
   {
      Post("/api/feed/add");
   }

   public override async Task HandleAsync(FeedInputDto dto, CancellationToken ct)
   {
       var outFeed = new FeedOutDto()
       {
           Title = dto.Title,
           Url = dto.Url,
           LastUpdated = SystemClock.Instance.GetCurrentInstant().ToString()
       };
       await SendAsync(outFeed);
   }
}