import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

public class TestGemini {
    public static void main(String[] args) throws Exception {
        String apiKey = "AIzaSyBscm1e2TmwWe73jBk0dh1yl_y5jRUfmdo";
        String model = "gemini-2.5-flash";
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;
        
        String jsonBody = "{\"contents\": [{\"parts\": [{\"text\": \"Hello, how are you?\"}]}], \"generationConfig\": {\"temperature\": 0.7}}";
        
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();
                
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println("Status Code: " + response.statusCode());
        System.out.println("Response Body: " + response.body());
    }
}
