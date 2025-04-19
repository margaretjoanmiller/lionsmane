using FastEndpoints;

namespace LionsManeApi.Feeds.Endpoints.CRUD;

sealed class UpdateFeedRequest
{

}

sealed class UpdateFeedResponse
{

}

sealed class UpdateFeedEndpoint() : Endpoint<UpdateFeedRequest, UpdateFeedResponse>
{
    public override void Configure()
    {
        Post("/api/feed/");
    }

    public override async Task HandleAsync(UpdateFeedRequest r, CancellationToken c)
    {
            
    }
}