import { useAuth } from "../hooks/useAuth";
import { Navigate, useNavigate } from "react-router";
import React from 'react'
import "./protected.scss"

const Protected = ({children}) => {
    const { loading, user, handleLogout } = useAuth()
    const navigate = useNavigate()

    const onLogout = async () => {
        await handleLogout()
        navigate('/login')
    }

    if(loading){
        return (<main className="loading-screen"><h1>Loading...</h1></main>)
    }

    if(!user){
        return <Navigate to={'/login'} />
    }

    const initial = (user.username || user.email || "U").charAt(0).toUpperCase()

    return (
        <>
            {children}
        </>
    )
}

export default Protected