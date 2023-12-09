import OpenAI from 'openai';
import config from 'config'
import { createReadStream } from 'fs'

class openAI {
    roles = {
        ASSISTANT: 'assistant',
        USER: 'user',
        SYSTEM: 'system'   
    }

    constructor(apiKey) {
          this.openai = new OpenAI({
            apiKey,
          });
    }
    async chat(messages) {
        try {
          const response = await this.openai.chat.completions.create({
            model: "gpt-4", //gpt-4, gpt-3.5-turbo
            messages,
          });
          return response.choices[0].message
        } catch (e) {
          console.log('Error while gpt chat', e.message)
        }
      }

    async transcription(filepath) {
        try {
          const response = await this.openai.audio.transcriptions.create({
            model: 'whisper-1',
            file: createReadStream(filepath),
          });
          //console.log(response)
          return response.text
        } catch (e) {
          console.log('Error while transcription', e.message)
        }
      }
}

export const openai = new openAI(config.get('OPENAI_KEY'))