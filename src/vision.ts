/**
 * @file Google Cloud Vision API wrapper.
 */
export class vision {
    apiKey: string;
    projectID: string;

    constructor(apiKey: string, projectID: string) {
        this.apiKey = apiKey;
        this.projectID = projectID;
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

        const response = await fetch(`https://us-central1-aiplatform.googleapis.com/v1/projects/${this.projectID}/locations/us-central1/publishers/google/models/imagetext:predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Bearer ${this.apiKey}`
            },
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