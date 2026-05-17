import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { toast } from 'react-hot-toast'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Login = () => {

    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        const result = await handleLogin({ email, password })
        if (result?.error) {
            toast.error("Invalid email or password")
        } else if (result?.user) {
            toast.success("Successfully logged in!")
            navigate('/')
        }
    }

    if (loading) {
        return (<main><h1>Loading.......</h1></main>)
    }


    return (
        <main>
            <div className="form-container">
                <h1>Login</h1>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            value={email}
                            onChange={(e) => { setEmail(e.target.value) }}
                            type="email" id="email" name='email' placeholder='Enter email address' />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            value={password}
                            onChange={(e) => { setPassword(e.target.value) }}
                            type="password" id="password" name='password' placeholder='Enter password' />
                    </div>
                    <button className='button primary-button' >Login</button>
                </form>
                <p>Don't have an account? <Link to={"/register"} >Register</Link> </p>
            </div>

            <footer>
                <p>&copy; {new Date().getFullYear()} AI Interview Prep</p>
                <p>Privacy Policy • Terms of Service</p>
                <p>Made by Biswasmruti Pradhan</p>
            </footer>
        </main>
    )
}

export default Login