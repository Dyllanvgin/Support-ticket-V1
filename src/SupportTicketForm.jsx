import { useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Box,
  Checkbox,
  Input,
  Button,
  Select,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  Text,
  Center,
  Textarea
} from '@chakra-ui/react'

const DESCRIPTION_OPTIONS = [
  'Screen not turning on',
  'Wrong content',
  'Screen on but black screen',
  'Content not updated',
  'No signal',
  'Physical damage',
  'Other'
]

const TICKET_BOARD_ID = '9575288798' // keep as is
const API_BASE_URL = 'http://192.168.10.207:4000' // your dev machine's IP

export default function SupportTicketForm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const client = searchParams.get('client') || ''

  const [storeName, setStoreName] = useState('')
  const [multipleScreens, setMultipleScreens] = useState(false)
  const [screens, setScreens] = useState([
    { name: '', description: '', otherDescription: '', photo: null }
  ])
  const [contactName, setContactName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [ticketSubmitted, setTicketSubmitted] = useState(false)

  useEffect(() => {
    if (client) setStoreName(`${client} Test`)
  }, [client])

  const handleScreenChange = (index, field, value) => {
    const newScreens = [...screens]
    newScreens[index][field] = value
    if (field === 'description' && value !== 'Other') {
      newScreens[index].otherDescription = ''
    }
    setScreens(newScreens)
  }

  const handlePhotoChange = (index, file) => {
    const newScreens = [...screens]
    newScreens[index].photo = file
    setScreens(newScreens)
  }

  const addScreen = () => {
    setScreens([
      ...screens,
      { name: '', description: '', otherDescription: '', photo: null }
    ])
  }

  const removeScreen = (index) => {
    setScreens(screens.filter((_, i) => i !== index))
  }

  async function createMainItem() {
    if (!storeName || storeName.trim() === '') {
      throw new Error('Store name cannot be empty')
    }

    const columnValuesObj = {
      email_mkssfg0w: {
        email: contactEmail,
        text: contactEmail
      },
      phone_mkssfmma: contactNumber,
      text_mkssz2ke: contactName
    }

    console.log('Creating main item with storeName:', storeName)
    console.log('Column values:', columnValuesObj)

    const response = await fetch(`${API_BASE_URL}/create-item`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        boardId: TICKET_BOARD_ID,
        itemName: storeName,
        columnValues: columnValuesObj
      })
    })

    const result = await response.json()
    console.log('🔍 Full result:', result)

    if (result.error) {
      console.error('❌ Error creating main item:', result.error)
      throw new Error('Create main item failed: ' + result.error)
    }

    if (result.errors) {
      console.error('❌ GraphQL errors creating main item:', result.errors)
      throw new Error(
        'Create main item failed: ' +
          result.errors.map((e) => e.message).join('; ')
      )
    }

    const itemId = result.data?.create_item?.id
    if (!itemId) {
      throw new Error('No item ID returned from create_item mutation')
    }

    console.log(`✅ Main Item created: ${itemId}`)
    return itemId
  }

  async function createSubitem(parentId, screen) {
    const subitemValuesObj = {
      text_mkss1h6r: screen.description || ''
    }

    if (screen.description === 'Other') {
      subitemValuesObj.text_mksswvza = screen.otherDescription || ''
    }

    console.log(`Creating subitem for parent ${parentId}`, subitemValuesObj)

    const response = await fetch(`${API_BASE_URL}/create-subitem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parentItemId: parentId,
        itemName: screen.name || 'Unnamed Screen',
        columnValues: subitemValuesObj
      })
    })

    const result = await response.json()
    console.log('📦 Subitem result:', result)

    if (result.error) {
      console.error('❌ Error creating subitem:', result.error)
      throw new Error('Subitem creation failed: ' + result.error)
    }

    if (result.errors) {
      console.error('❌ GraphQL errors creating subitem:', result.errors)
      throw new Error(
        'Subitem creation failed: ' +
          result.errors.map((e) => e.message).join('; ')
      )
    }

    const subitemId = result.data?.create_subitem?.id
    if (!subitemId) {
      throw new Error('No item ID returned from create_subitem mutation')
    }

    console.log(`📦 Subitem created under ${parentId}: ${subitemId}`)
    return subitemId
  }

  async function uploadPhoto(subitemId, file) {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)

    const columnId = 'file_mksszjy2'

    const response = await fetch(
      `${API_BASE_URL}/upload?item_id=${subitemId}&column_id=${columnId}`,
      {
        method: 'POST',
        body: formData
      }
    )

    const result = await response.json()
    console.log(`📤 Uploaded file for subitem ${subitemId}:`, result)
    if (result.errors) {
      console.error('❌ File upload error:', result.errors)
      throw new Error(
        'File upload failed: ' + result.errors.map((e) => e.message).join('; ')
      )
    }
    return result
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const mainItemId = await createMainItem()

      for (const screen of screens) {
        const subitemId = await createSubitem(mainItemId, screen)
        if (screen.photo) {
          await uploadPhoto(subitemId, screen.photo)
        }
      }

      setTicketSubmitted(true)
      console.log('🎉 Ticket submitted successfully.')
    } catch (err) {
      console.error('Ticket submission error:', err)
      alert('Ticket submission failed. See console for details.')
    }
  }

  const handleResetForm = () => {
    setStoreName(client ? `${client} Test` : '')
    setMultipleScreens(false)
    setScreens([{ name: '', description: '', otherDescription: '', photo: null }])
    setContactName('')
    setContactNumber('')
    setContactEmail('')
    setTicketSubmitted(false)
  }

  const handleClosePortal = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      window.close()
    }
  }

  const inputProps = {
    bg: '#2d2d2d',
    color: 'white',
    borderColor: '#444',
    _placeholder: { color: '#bbb' }
  }

  const descriptionInputProps = {
    bg: '#ddd',
    color: 'black',
    borderColor: '#999',
    _placeholder: { color: '#555' }
  }

  if (ticketSubmitted) {
    return (
      <Center py={20} bg="#fb6520" minH="100vh">
        <VStack spacing={6}>
          <Text fontSize="2xl" fontWeight="bold" color="white">
            ✅ Ticket Submitted!
          </Text>
          <Button colorScheme="blue" onClick={handleResetForm}>
            Submit Another
          </Button>
          <Button variant="outline" onClick={handleClosePortal}>
            Close Ticket Portal
          </Button>
        </VStack>
      </Center>
    )
  }

  return (
    <Center py={10} bg="#fb6520" minH="100vh">
      <Box maxW="600px" w="100%" p={6} bg="black" boxShadow="md" borderRadius="md">
        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch" color="white">
            <FormControl>
              <FormLabel>Store Name:</FormLabel>
              <Input
                {...inputProps}
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Store name"
                isRequired
              />
            </FormControl>

            <Checkbox
              isChecked={multipleScreens}
              onChange={(e) => setMultipleScreens(e.target.checked)}
            >
              Multiple Screens
            </Checkbox>

            {screens.map((screen, idx) => (
              <Box key={idx} p={4} borderWidth="1px" borderRadius="md" borderColor="#333">
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="bold">Screen {idx + 1}</Text>
                  {screens.length > 1 && (
                    <Button size="sm" colorScheme="red" onClick={() => removeScreen(idx)}>
                      Remove
                    </Button>
                  )}
                </HStack>

                <FormControl mb={3}>
                  <FormLabel>Screen Location:</FormLabel>
                  <Input
                    {...inputProps}
                    value={screen.name}
                    onChange={(e) => handleScreenChange(idx, 'name', e.target.value)}
                    placeholder="Screen Location"
                    isRequired
                  />
                </FormControl>

                <FormControl mb={3}>
                  <FormLabel>Description:</FormLabel>
                  <Select
                    {...descriptionInputProps}
                    value={screen.description}
                    onChange={(e) => handleScreenChange(idx, 'description', e.target.value)}
                    placeholder="Select issue"
                    isRequired
                  >
                    {DESCRIPTION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>

                  {screen.description === 'Other' && (
                    <Textarea
                      {...descriptionInputProps}
                      mt={2}
                      placeholder="Please explain the issue"
                      value={screen.otherDescription}
                      onChange={(e) =>
                        handleScreenChange(idx, 'otherDescription', e.target.value)
                      }
                      isRequired
                    />
                  )}
                </FormControl>

                <FormControl mb={3}>
                  <FormLabel>Upload Photo:</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoChange(idx, e.target.files[0])}
                    bg="#2d2d2d"
                    borderColor="#444"
                    color="white"
                  />
                </FormControl>
              </Box>
            ))}

            {multipleScreens && (
              <Button onClick={addScreen} colorScheme="blue" size="sm">
                Add Screen
              </Button>
            )}

            <FormControl>
              <FormLabel>Your Name:</FormLabel>
              <Input
                {...inputProps}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Your name"
                isRequired
              />
            </FormControl>

            <FormControl>
              <FormLabel>Contact Number:</FormLabel>
              <Input
                {...inputProps}
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="Contact number"
                isRequired
              />
            </FormControl>

            <FormControl>
              <FormLabel>Email Address:</FormLabel>
              <Input
                {...inputProps}
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="Email address"
                isRequired
              />
            </FormControl>

            <Button type="submit" colorScheme="green" size="lg" mt={4}>
              Submit
            </Button>
          </VStack>
        </form>
      </Box>
    </Center>
  )
}
