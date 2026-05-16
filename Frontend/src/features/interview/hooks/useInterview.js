import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf, deleteInterviewReport } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports, error, setError } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        setError(null)
        let response = null
        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            console.log("[useInterview] generateReport response:", response)
            if (response?.interviewReport) {
                setReport(response.interviewReport)
                return response.interviewReport
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message || "Failed to generate report"
            setError(msg)
            console.error("[useInterview] generateReport error:", msg)
        } finally {
            setLoading(false)
        }
        return null
    }

    const getReportById = async (id) => {
        setLoading(true)
        setError(null)
        try {
            const response = await getInterviewReportById(id)
            console.log("[useInterview] getReportById response:", response)
            if (response?.interviewReport) {
                setReport(response.interviewReport)
                return response.interviewReport
            } else {
                console.warn("[useInterview] getReportById: no interviewReport in response", response)
                setReport(null)
                setError("Report data is empty or malformed.")
            }
        } catch (error) {
            const msg = error.response?.data?.message || error.message || "Failed to fetch report"
            setError(msg)
            setReport(null)
            console.error("[useInterview] getReportById error:", msg)
        } finally {
            setLoading(false)
        }
        return null
    }

    const getReports = async () => {
        setLoading(true)
        setError(null)
        let response = null
        try {
            response = await getAllInterviewReports()
            if (response?.interviewReports) {
                setReports(response.interviewReports)
                return response.interviewReports
            }
        } catch (error) {
            console.error(error.response?.data || error.message || error)
        } finally {
            setLoading(false)
        }
        return null
    }

    const deleteReport = async (interviewId) => {
        try {
            await deleteInterviewReport(interviewId)
            setReports(prev => prev.filter(r => r._id !== interviewId))
            if (report && report._id === interviewId) {
                setReport(null)
            }
            return true
        } catch (error) {
            console.error("[useInterview] deleteReport error:", error.response?.data?.message || error.message)
            return false
        }
    }

    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        try {
            const response = await generateResumePdf({ interviewReportId })
            if (response) {
                const url = window.URL.createObjectURL(new Blob([response], { type: "application/pdf" }))
                const link = document.createElement("a")
                link.href = url
                link.setAttribute("download", `resume_${interviewReportId}.pdf`)
                document.body.appendChild(link)
                link.click()
                return true
            }
        } catch (error) {
            console.error(error.response?.data || error.message || error)
        } finally {
            setLoading(false)
        }
        return false
    }

    useEffect(() => {
        if (interviewId) {
            // Skip refetch if the report is already loaded for this interviewId
            if (report && report._id === interviewId) {
                console.log("[useInterview] Report already loaded for", interviewId, "- skipping fetch")
                return
            }
            console.log("[useInterview] Fetching report for", interviewId)
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [ interviewId ])

    return { loading, report, reports, error, generateReport, getReportById, getReports, getResumePdf, deleteReport }

}
