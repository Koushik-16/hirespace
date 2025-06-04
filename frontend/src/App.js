import React from 'react'
import Login from './components/Login'
import { Route, Routes , Navigate } from 'react-router-dom'
import Register from './components/Register'
import Interview from './components/Interview'
import Home from './components/Home'
import "./App.css"
import { useAuthContext } from './context/AuthContext'
import { SocketProvider } from './context/Socket'

function App() {
	const auth = useAuthContext();
  const authUser = auth?.authUser;
	return (
		<div>
		
			<Routes>
				<Route path='/' element={authUser ? <Home /> : <Navigate to={"/login"} />} />
				<Route path='/login' element={authUser ? <Navigate to='/' /> : <Login />} />
				<Route path='/register' element={authUser ? <Navigate to='/' /> : <Register />} />
				<Route path='/interview/sessions/:sessionCode' element = {authUser ? <Interview/> : <Navigate to={"/login"} /> } />
			</Routes>
		
		</div>
	);
}

export default App;
