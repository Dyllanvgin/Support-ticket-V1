import { useSearchParams, useNavigate } from 'react-router-dom'
import { Center, Button, Box } from '@chakra-ui/react'
import { keyframes } from '@emotion/react'

export default function LandingPage() {
  const [searchParams] = useSearchParams()
  const client = searchParams.get('client') || ''
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/ticket?client=${encodeURIComponent(client)}`)
  }

  // Pulse ring keyframes
  const pulseRing = keyframes`
    0% {
      box-shadow: 0 0 0 0 rgba(251, 101, 32, 0.6);
    }
    70% {
      box-shadow: 0 0 0 20px rgba(251, 101, 32, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(251, 101, 32, 0);
    }
  `

  return (
    <Box bg="#f9f7f1" height="100vh" display="flex" alignItems="center" justifyContent="center">
      <Button
        bg="orange.400"
        color="white"
        _hover={{ bg: 'orange.500' }}
        border="4px solid"
        borderColor="blackAlpha.700"
        borderRadius="50%"
        width="150px"
        height="150px"
        fontSize="2xl"
        fontWeight="bold"
        boxShadow="xl"
        onClick={handleClick}
        sx={{
          textShadow: `
            -1px -1px 0 #000,
            1px -1px 0 #000,
            -1px 1px 0 #000,
            1px 1px 0 #000
          `,
          animation: `${pulseRing} 1.8s infinite`
        }}
      >
        Support Ticket
      </Button>
    </Box>
  )
}
