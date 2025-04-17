namespace LionsManeApi.Tags;

public class Tag
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required Guid ReaderId { get; set; }
}