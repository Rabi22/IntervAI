const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
})


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked 6in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `Generate a highly detailed, structured interview report for a candidate based on the provided details.
    
    Resume: ${resume}
    Self Description: ${selfDescription}
    Job Description: ${jobDescription}

    You MUST return a JSON object that STRICTLY follows the provided schema. 
    Do NOT write a giant paragraph in the "title". The title should just be a short job title (e.g. "Frontend Developer").
    You MUST generate at least 3 items for technicalQuestions, 3 items for behavioralQuestions, 3 skillGaps, and a 3-day preparationPlan.
    Calculate a matchScore between 0 and 100 based on how well the resume matches the job description.
`

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "object",
                properties: {
                    matchScore: { type: "integer", description: "A score between 0 and 100 indicating how well the candidate matches the job" },
                    technicalQuestions: {
                        type: "array",
                        description: "List of 3 to 5 technical interview questions to ask the candidate.",
                        items: {
                            type: "object",
                            properties: {
                                question: { type: "string", description: "The specific technical question" },
                                intention: { type: "string", description: "Why ask this? What does it test?" },
                                answer: { type: "string", description: "The ideal answer or key points to look for" }
                            }
                        }
                    },
                    behavioralQuestions: {
                        type: "array",
                        description: "List of 3 behavioral interview questions.",
                        items: {
                            type: "object",
                            properties: {
                                question: { type: "string" },
                                intention: { type: "string" },
                                answer: { type: "string" }
                            }
                        }
                    },
                    skillGaps: {
                        type: "array",
                        description: "List of missing skills from the candidate's resume compared to the job description.",
                        items: {
                            type: "object",
                            properties: {
                                skill: { type: "string" },
                                severity: { type: "string", description: "Must be 'low', 'medium', or 'high'" }
                            }
                        }
                    },
                    preparationPlan: {
                        type: "array",
                        description: "A day-by-day study plan for the candidate.",
                        items: {
                            type: "object",
                            properties: {
                                day: { type: "integer" },
                                focus: { type: "string" },
                                tasks: { type: "array", items: { type: "string" } }
                            }
                        }
                    },
                    title: { type: "string", description: "A very short, standard job title like 'Backend Engineer' or 'Frontend Developer'" }
                }
            },
        }
    })

    const parsed = JSON.parse(response.text)

    // Validate that the AI returned at least SOMETHING useful
    const hasTechnical = Array.isArray(parsed.technicalQuestions) && parsed.technicalQuestions.length > 0
    const hasBehavioral = Array.isArray(parsed.behavioralQuestions) && parsed.behavioralQuestions.length > 0
    const hasScore = typeof parsed.matchScore === 'number'

    // If we have at least the score or some questions, we can save it.
    if (!hasTechnical && !hasBehavioral && !hasScore) {
        throw new Error("AI failed to generate a valid structured report. It returned: " + JSON.stringify(parsed).substring(0, 200))
    }

    // Ensure all arrays exist even if empty so frontend doesn't crash
    parsed.technicalQuestions = parsed.technicalQuestions || []
    parsed.behavioralQuestions = parsed.behavioralQuestions || []
    parsed.preparationPlan = parsed.preparationPlan || []
    parsed.skillGaps = parsed.skillGaps || []
    parsed.matchScore = parsed.matchScore || 0

    return parsed
}


async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "object",
                properties: {
                    html: { type: "string", description: "The HTML content of the resume which can be converted to PDF using any library like puppeteer" }
                }
            },
        }
    })


    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf }