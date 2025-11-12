namespace server.Data;

public class MongoDbSettings
{
    // connection string taken from configuration
    public string ConnectionString { get; set; } = string.Empty;
    // database name we will open on the server
    public string DatabaseName { get; set; } = string.Empty;
}
