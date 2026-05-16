const pdfParse = require("pdf-parse-new")
const mammoth = require("mammoth")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../../src/config/models/InterviewReport.Model")


/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    const { selfDescription, jobDescription } = req.body
    const safeSelfDescription = String(selfDescription || "").trim()
    const safeJobDescription = String(jobDescription || "").trim()

    if (!req.file && !safeSelfDescription) {
        return res.status(400).json({ message: "Please upload a PDF/TXT/DOCX resume or provide a self description." })
    }

    let resumeContent = { text: "" }
    if (req.file) {
        const filename = req.file.originalname || ""
        const extension = filename.split('.').pop()?.toLowerCase()
        const isPlainText = req.file.mimetype === "text/plain" || extension === "txt"
        const isDocx = req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || extension === "docx"

        if (!isPlainText && !isDocx && req.file.mimetype !== "application/pdf") {
            return res.status(400).json({ message: "Only PDF, TXT or DOCX resumes are currently supported. Please upload a valid file." })
        }

        if (isPlainText) {
            resumeContent.text = req.file.buffer.toString("utf8")
        } else if (isDocx) {
            try {
                const result = await mammoth.extractRawText({ buffer: req.file.buffer })
                resumeContent.text = result.value || ""
            } catch (error) {
                console.error("DOCX parse error:", error.message)
                return res.status(400).json({ message: "Invalid DOCX structure. Please upload a valid DOCX resume." })
            }
        } else {
            try {
                resumeContent = await pdfParse(req.file.buffer)
            } catch (error) {
                console.error("PDF parse error:", error.message)
                return res.status(400).json({ message: "Invalid PDF structure. Please upload a valid PDF resume." })
            }
        }
    }


    try {
        const interViewReportByAi = await generateInterviewReport({
            resume: resumeContent.text,
            selfDescription,
            jobDescription: safeJobDescription
        })

        const title = String(interViewReportByAi?.title || safeJobDescription.split('\n')[0] || "Job Title").trim() || "Job Title"

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeContent.text,
            selfDescription,
            jobDescription: safeJobDescription,
            ...interViewReportByAi,
            title
        })

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (error) {
        console.error("Report generation error:", error.message || error)
        res.status(500).json({
            message: "Failed to generate interview report. Error: " + (error.message || String(error))
        })
    }

}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}


/**
 * @description Controller to delete an interview report by its ID.
 */
async function deleteInterviewReportController(req, res) {
    const { interviewId } = req.params

    try {
        const deleted = await interviewReportModel.findOneAndDelete({ _id: interviewId, user: req.user.id })

        if (!deleted) {
            return res.status(404).json({ message: "Interview report not found." })
        }

        res.status(200).json({ message: "Interview report deleted successfully." })
    } catch (error) {
        console.error("Delete report error:", error.message)
        res.status(500).json({ message: "Failed to delete interview report." })
    }
}

module.exports = { generateInterViewReportController, getInterviewReportByIdController, getAllInterviewReportsController, generateResumePdfController, deleteInterviewReportController }