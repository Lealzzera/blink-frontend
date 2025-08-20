import { apiEndpoints, createApiHeaders} from "./api"

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
            mode: "cors",
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