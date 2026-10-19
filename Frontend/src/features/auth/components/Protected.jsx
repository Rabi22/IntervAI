import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import "./protected.scss"

const Protected = ({children}) => {
    const { loading, user } = useAuth()

    if(loading){
        return (<main className="loading-screen"><h1>Loading...</h1></main>)
    }

    if(!user){
        return <Navigate to={'/login'} />
    }

    return (
        <>
            {children}
        </>
    )
}

export default Protected