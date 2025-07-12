import { useSearchParams, useNavigate } from 'react-router-dom'
import { Center, Button, Box } from '@chakra-ui/react'

export default function LandingPage() {
  const [searchParams] = useSearchParams()
  const client = searchParams.get('client') || ''
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/ticket?client=${encodeURIComponent(client)}`)
  }

  return (
    <Box bg="#f9f7f1" height="100vh" display="flex" alignItems="center" justifyContent="center">
      <Button
        bg="orange.400"
        color="white"
        _hover={{ bg: "orange.500" }}
        border="4px solid"
        borderColor="blackAlpha.700"
        borderRadius="50%"
        width="150px"
        height="150px"
        fontSize="2xl"
        fontWeight="bold"
        boxShadow="xl"
        style={{
          textShadow: `
            -1px -1px 0 #000,
            1px -1px 0 #000,
            -1px 1px 0 #000,
            1px 1px 0 #000
          `,
        }}
        onClick={handleClick}
      >
        Support Ticket
      </Button>
    </Box>
  )
}
