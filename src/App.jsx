import { Routes, Route } from 'react-router-dom'
import LandingPage from './LandingPage.jsx'
import SupportTicketForm from './SupportTicketForm.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/ticket" element={<SupportTicketForm />} />
    </Routes>
  )
}
