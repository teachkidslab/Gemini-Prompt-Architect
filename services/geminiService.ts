import { GoogleGenAI, Type } from "@google/genai";
import { PromptState, CategoryOption, PromptMode } from "../types";

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key not found");
    }
    return new GoogleGenAI({ apiKey });
};

export const analyzeImage = async (
    base64Image: string,
    language: 'en' | 'ua'
): Promise<string[]> => {
    try {
        const ai = getClient();
        // Remove header if present (e.g., "data:image/jpeg;base64,")
        const base64Data = base64Image.split(',')[1] || base64Image;

        const systemInstruction = `
            You are an expert at analyzing faces for AI Image Generation (Stable Diffusion/Midjourney).
            
            GOAL: Extract physical facial features to ensure high likeness in generation.
            
            FOCUS ON:
            1. Age & Ethnicity (Specific)
            2. Face Shape (Oval, square, jawline definition)
            3. Eyes (Color, shape, eyebrows, eyelids)
            4. Nose (Bridge, shape, size)
            5. Mouth/Lips (Shape, thickness)
            6. Hair (Color, exact style, texture, hairline)
            7. Skin (Texture, freckles, complexion)
            8. Distinguishing marks (Moles, scars, dimples)
            
            OUTPUT:
            - Return ONLY a JSON array of strings.
            - Example: ["30 year old male", "sharp jawline", "deep set blue eyes", "bushy eyebrows", "straight nose", "stubble beard", "scar on left cheek"]
            - Language: ${language === 'ua' ? 'Ukrainian' : 'English'}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: base64Data } },
                    { text: "Analyze this face and list physical descriptors for a prompt." }
                ]
            },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);

    } catch (error) {
        console.error("Face analysis failed", error);
        return [];
    }
};

export const analyzeStyle = async (
    base64Image: string,
    language: 'en' | 'ua'
): Promise<string[]> => {
    try {
        const ai = getClient();
        const base64Data = base64Image.split(',')[1] || base64Image;

        const systemInstruction = `
            You are an expert art historian and digital art critic.
            
            GOAL: Analyze the artistic style, medium, color palette, and technique of the provided image to replicate its "vibe" in a text prompt.
            
            FOCUS ON:
            1. Medium (Oil painting, digital 3D render, watercolor, pencil sketch, photography)
            2. Art Movement (Impressionism, Surrealism, Cyberpunk, Baroque, Minimalism)
            3. Color Palette (Vibrant neon, muted earth tones, monochrome, pastel, high contrast)
            4. Technique (Impasto brushstrokes, cel-shaded, soft focus, sharp lines, grain)
            5. Atmosphere (Dreamy, gritty, ethereal, gloomy)
            
            OUTPUT:
            - Return ONLY a JSON array of descriptive keywords/phrases.
            - Example: ["oil painting style", "thick impasto strokes", "vibrant orange and teal palette", "expressive lighting", "abstract forms"]
            - Language: ${language === 'ua' ? 'Ukrainian' : 'English'}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: base64Data } },
                    { text: "Analyze the style of this image." }
                ]
            },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);

    } catch (error) {
        console.error("Style analysis failed", error);
        return [];
    }
};

export const enhancePrompt = async (
    currentSelection: PromptState, 
    mode: PromptMode, 
    language: 'en' | 'ua',
    faceDescription: string = "",
    styleDescription: string = "",
    videoDuration: number = 5,
    manualInput: string = ""
): Promise<string> => {
    try {
        const ai = getClient();
        
        // Flatten selections into a string for the prompt
        let currentPromptText = "";
        
        // Include manual input as the priority context
        if (manualInput) {
            const label = language === 'ua' ? "ПОТОЧНИЙ ЧЕРНОВИК (Редагувати це)" : "CURRENT DRAFT (Refine this)";
            currentPromptText += `[${label}]: ${manualInput}; \n`;
        }

        // Inject Face Description specifically if it exists
        if (faceDescription) {
            const label = language === 'ua' ? "ДЕТАЛІ ОБЛИЧЧЯ (ВАЖЛИВО)" : "FACE DETAILS (CRITICAL)";
            currentPromptText += `[${label}]: ${faceDescription}; \n`;
        }

        // Inject Style Description specifically if it exists
        if (styleDescription) {
            const label = language === 'ua' ? "РЕФЕРЕНС СТИЛЮ" : "STYLE REFERENCE";
            currentPromptText += `[${label}]: ${styleDescription}; \n`;
        }
        
        if (mode === 'video') {
            const label = language === 'ua' ? "ТРИВАЛІСТЬ ВІДЕО" : "VIDEO DURATION";
            currentPromptText += `[${label}]: ${videoDuration} seconds; \n`;
        }

        // IMPORTANT: Add all selected tags
        Object.keys(currentSelection).forEach(key => {
            const items = currentSelection[key].map(opt => opt.value).join(", ");
            if (items) currentPromptText += `[${key.toUpperCase()}]: ${items}; `;
        });

        if (!currentPromptText) {
            return language === 'ua' ? "Будь ласка, спочатку оберіть кілька тегів або напишіть щось." : "Please select some tags or write something first.";
        }

        const startPhrase = mode === 'image' 
            ? (language === 'ua' ? 'Створіть зображення, де' : 'Create an image where') 
            : (language === 'ua' ? 'Згенеруйте відео, де' : 'Generate a video where');

        const systemInstruction = `You are an elite Digital Art Director and Prompt Engineer specializing in high-end generative models (Midjourney v6, Sora, Veo, Runway).
        
        GOAL: Transform the provided input (User Tags + User Manual Draft) into a seamless, cinematic narrative prompt.
        
        MANDATORY RULES:
        1. **MANDATORY START**: Start exactly with: "${startPhrase}" followed immediately by the subject.
        
        2. **STRICT TAG ADHERENCE**: 
           - You MUST include ALL specific objects, props, and style elements found in the [TAGS] or User Input. 
           - If a user selected "[PROPS]: red roses", the subject MUST be holding or interacting with red roses. 
           - If a user selected "[STYLE]: cyberpunk", the description MUST describe a cyberpunk aesthetic.
           - Do not ignore selected tags. They are strict constraints.

        3. **FLUID NARRATIVE FLOW (SOPHISTICATED CONSTRUCTION)**: 
           - **Do NOT** output a robotic list of tags. 
           - **Connect** elements deeply: Instead of "Woman. Rain. Dark lighting.", write "A woman stands elegantly in the rain, her silhouette carved by the sharp contrast of dark, moody lighting."
           - **Active Voice**: Use active verbs (e.g., "Light cascades," "Shadows engulf," "The camera pushes in"). Avoid passive voice.
           - **Sensory Details**: Describe textures, temperatures, and atmospheric density.

        4. **VIDEO MODE SPECIFICS (If Mode is Video)**:
           - **Screenplay Style**: Write like a high-budget movie script action line.
           - **Dynamic Motion**: The subject must be ALIVE. Use verbs like *strides, hesitates, erupts, drifts, races*.
           - **Camera Integration**: Do not just list "Tracking Shot". Incorporate it: "The camera tracks backward, revealing the vast landscape as the subject runs."
           - **Pacing**: If [DURATION] is short (2-4s), focus on one impactful motion. If long (5-10s), describe a micro-sequence or evolving atmosphere.

        5. **STYLE & INTENSITY**:
           - Use [STYLE] and [STYLE_INTENSITY] to modulate the descriptiveness.
           - High intensity = evocative, flowery, artistic adjectives.
           - Low intensity = grounded, literal, photographic description.

        OUTPUT FORMAT:
        - Return ONLY the final prompt string.
        - Do NOT wrap in quotes.
        
        Language: ${language === 'ua' ? 'Ukrainian' : 'English'}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `User Input: ${currentPromptText}. \n\n Mode: ${mode.toUpperCase()}. \n\n Generate the Narrative Prompt ensuring all selected tags are visually present.`,
            config: {
                systemInstruction: systemInstruction,
                thinkingConfig: { thinkingBudget: 0 } 
            }
        });

        return response.text || "";
    } catch (error) {
        console.error("Gemini enhancement failed", error);
        return "Error generating enhancement. Please check API Key.";
    }
};

export const formatPrompt = async (
    promptText: string,
    mode: PromptMode,
    language: 'en' | 'ua'
): Promise<string> => {
    try {
        const ai = getClient();
        if (!promptText) return "";

        const startPhrase = mode === 'image' 
            ? (language === 'ua' ? 'Створіть зображення, де' : 'Create an image where') 
            : (language === 'ua' ? 'Згенеруйте відео, де' : 'Generate a video where');

        const systemInstruction = `You are a professional AI Prompt Formatter.
        
        GOAL: Convert a structured list of tags into a fluid, grammatical, and professional prompt.
        
        MANDATORY RULES:
        1. **Start Phrase**: Start exactly with: "${startPhrase}".
        
        2. **Sentence Structure & Flow**: 
           - **Primary Sentence**: Combine [Subject] + [Action] + [Props] in the [Environment]. Make it the core narrative focus.
           - **Atmosphere & Technicals**: Weave [Lighting], [Mood], and [Visual Effects] into the scene description naturally (e.g., "bathed in soft warm light," "amidst a chaotic storm of particles").
           - **Technical Specs**: Append [Camera], [Framing], [Style], and [Quality] details as a polished technical suffix or integrated into the viewpoint (e.g., "captured through a fisheye lens," "rendered in a gritty cyberpunk style").
           - **Avoid Repetition**: If "Cyberpunk" is mentioned in style and environment, merge them into "Cyberpunk city environment".

        3. **Video Optimization (If Video)**: 
           - **Motion First**: Transform static tags into motion descriptions. 
           - Instead of "Car. Fast.", write "A car speeds down the highway, blurring the surroundings..."
           - **Camera Movement**: Integrate camera instructions (e.g., "Tracking shot", "Drone flyover") as the perspective of the description.
           - **Temporal Continuity**: Ensure the action described flows logically for the duration.

        4. **Cleanliness**: Remove any category headers like "[Subject]:". Output text only.
        
        Output Language: ${language === 'ua' ? 'Ukrainian' : 'English'}
        `;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: promptText,
            config: {
                systemInstruction: systemInstruction,
                thinkingConfig: { thinkingBudget: 0 } 
            }
        });

        return response.text || "";
    } catch (error) {
        console.error("Gemini formatting failed", error);
        return promptText; 
    }
};

export const getSuggestedTags = async (
    currentTags: string,
    mode: PromptMode,
    language: 'en' | 'ua'
): Promise<Record<string, string[]>> => {
   try {
    const ai = getClient();
    const systemInstruction = `
      You are a creative assistant for a generative AI artist.
      Analyze the user's current prompt tags and suggest 5-7 COMPLEMENTARY tags that would improve the image/video.
      
      Do NOT suggest tags that are already present.
      Focus on adding depth: if they have a subject, suggest a matching environment or lighting.
      
      Categories for suggestions:
      - environment
      - props (Objects that fit the scene)
      - style (Art style)
      - visual_style (Design aesthetics like flat, brutalist, etc.)
      - mood
      - lighting
      - camera
      - visual_rules (Composition)
      - visual_effects
      - quality (boosters like 8k, masterpiece)
      - color_palette
      
      Input Language: ${language === 'ua' ? 'Ukrainian' : 'English'}
      Output Language: ${language === 'ua' ? 'Ukrainian' : 'English'}
      
      Return JSON: { categoryId: [suggested_tag_1, suggested_tag_2] }
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Current tags: "${currentTags}". Mode: ${mode}. Suggest missing tags.`,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    environment: { type: Type.ARRAY, items: { type: Type.STRING } },
                    props: { type: Type.ARRAY, items: { type: Type.STRING } },
                    style: { type: Type.ARRAY, items: { type: Type.STRING } },
                    visual_style: { type: Type.ARRAY, items: { type: Type.STRING } },
                    mood: { type: Type.ARRAY, items: { type: Type.STRING } },
                    lighting: { type: Type.ARRAY, items: { type: Type.STRING } },
                    camera: { type: Type.ARRAY, items: { type: Type.STRING } },
                    visual_rules: { type: Type.ARRAY, items: { type: Type.STRING } },
                    visual_effects: { type: Type.ARRAY, items: { type: Type.STRING } },
                    quality: { type: Type.ARRAY, items: { type: Type.STRING } },
                    color_palette: { type: Type.ARRAY, items: { type: Type.STRING } },
                }
            }
        }
    });

    return JSON.parse(response.text || "{}");
   } catch (e) {
       console.error("Suggestion failed", e);
       return {};
   }
}

export const generateVideo = async (
    prompt: string, 
    aspectRatio: '16:9' | '9:16' = '16:9',
    imageBase64?: string | null
): Promise<string | null> => {
    try {
        const ai = getClient();
        
        let params: any = {
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio,
            }
        };

        // If an image is provided, strip metadata header and add to parameters
        if (imageBase64) {
            const base64Data = imageBase64.split(',')[1] || imageBase64;
            params.image = {
                imageBytes: base64Data,
                mimeType: 'image/jpeg', // Defaulting to jpeg; Veo supports common formats
            };
        }

        let operation = await ai.models.generateVideos(params);

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (videoUri) {
            return `${videoUri}&key=${process.env.API_KEY}`;
        }
        return null;

    } catch (error) {
        console.error("Veo video generation failed", error);
        throw error;
    }
};