namespace server.Helpers;

public class ResponseWrapper<T>
{
    // flag to indicate overall request status
    public bool Success { get; set; }
    // optional message shared with client
    public string? Message { get; set; }
    // actual payload returned
    public T? Data { get; set; }

    public ResponseWrapper(bool success, string? message, T? data)
    {
        // capture values for later serialization
        Success = success;
        Message = message;
        Data = data;
    }

    // convenience builder for success responses
    public static ResponseWrapper<T> Ok(T data, string? message = null) => new(true, message, data);

    // convenience builder for failure responses
    public static ResponseWrapper<T> Fail(string message) => new(false, message, default);
}
