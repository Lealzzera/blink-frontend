import { apiEndpoints, createApiHeaders} from "./api"

/*
    "phone_number": "string",
    "picture_url": "string",
    "patient_name": "string",
    "last_message": "string",
    "sent_at": "2025-08-15T15:34:54.002Z",
    "from_me": true,
    "ai_answer": true
*/


export interface ChatConfig{
    phone_number: string;
    picture_url: string;
    whats_app_name: string;
    last_message: string;
    sent_at: string;
    from_me: boolean;
    ai_answer: boolean;
}


export const chatService = {
    async getOverview(token: string): Promise<ChatConfig[]> {
        const response = await fetch(apiEndpoints.overview, {
            headers: createApiHeaders(token)
        });

        if (!response.ok) {
            throw new Error(`Erro ao buscar overview: ${response.status}`);
        }

        const data: ChatConfig[] = await response.json();
        console.log(data);

        return data;
    }
};