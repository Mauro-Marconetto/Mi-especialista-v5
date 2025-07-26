'use server';

/**
 * @fileOverview AI flow to generate summarized wellness tips related to a medical specialty.
 *
 * - generateWellnessTips - A function that generates summarized wellness tips.
 * - GenerateWellnessTipsInput - The input type for the generateWellnessTips function.
 * - GenerateWellnessTipsOutput - The return type for the generateWellnessTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWellnessTipsInputSchema = z.object({
  medicalSpecialty: z.string().describe('The medical specialty to generate wellness tips for.'),
});
export type GenerateWellnessTipsInput = z.infer<typeof GenerateWellnessTipsInputSchema>;

const GenerateWellnessTipsOutputSchema = z.object({
  wellnessTips: z.string().describe('Summarized wellness tips related to the medical specialty.'),
});
export type GenerateWellnessTipsOutput = z.infer<typeof GenerateWellnessTipsOutputSchema>;

export async function generateWellnessTips(input: GenerateWellnessTipsInput): Promise<GenerateWellnessTipsOutput> {
  return generateWellnessTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWellnessTipsPrompt',
  input: {schema: GenerateWellnessTipsInputSchema},
  output: {schema: GenerateWellnessTipsOutputSchema},
  prompt: `You are a health and wellness expert. Generate summarized wellness tips related to the following medical specialty: {{{medicalSpecialty}}}.\n\nWellness Tips:`, 
});

const generateWellnessTipsFlow = ai.defineFlow(
  {
    name: 'generateWellnessTipsFlow',
    inputSchema: GenerateWellnessTipsInputSchema,
    outputSchema: GenerateWellnessTipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
