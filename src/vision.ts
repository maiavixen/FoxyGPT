/**
 * @file Google Cloud Vision API wrapper.
 */
// import google-auth-library
import { GoogleAuth } from 'google-auth-library';

export class vision {
    apiKey: string;
    projectID: string;
    auth: GoogleAuth;

    constructor(apiKey: string, projectID: string) {
        this.apiKey = apiKey;
        this.projectID = projectID;
        this.auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        });
    }


    /**
     * Describe an image.
     * @param base64image {string} - Base64 encoded image.
     * @param sampleCount {number} - Number of samples to return.
     * @param language {string} - Language to use.
     */
    public async describe(base64image: string, sampleCount?: number, language?: string) {
        if (!sampleCount) sampleCount = 1;
        if (!language) language = 'en';

        // Get the Google Cloud credentials.
        const authClient = await this.auth.getClient();

        // const projectId = 'affable-ring-399020';
        // const url = `https://dns.googleapis.com/dns/v1/projects/${projectId}`;
        const authHeaders = await authClient.getRequestHeaders();
        if (!authHeaders) throw new Error('Failed to get authentication headers.');

        const response = await fetch(`https://us-central1-aiplatform.googleapis.com/v1/projects/${this.projectID}/locations/us-central1/publishers/google/models/imagetext:predict`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                "instances": [
                    {
                        "image": {
                            "bytesBase64Encoded": base64image
                        }
                    }
                ],
                "parameters": {
                    "sampleCount": sampleCount,
                    "language": language
                }
            })
        });

        if(response.status !== 200) throw new Error(`Error ${response.status}: ${response.statusText}`);

        const data = await response.json();
        return data;
    }
}