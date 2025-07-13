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
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalHeader,
  Progress,
  useDisclosure,
  Spinner,
  Icon,
  useToast,
  Image,
  FormErrorMessage
} from '@chakra-ui/react'
import { FiMonitor, FiUpload, FiPlus, FiTrash2, FiUser, FiPhone, FiMail } from 'react-icons/fi'

const DESCRIPTION_OPTIONS = [
  'Screen not turning on',
  'Wrong content',
  'Screen on but black screen',
  'Content not updated',
  'No signal',
  'Physical damage',
  'Other'
]

const TICKET_BOARD_ID = '9575288798'
const API_BASE_URL = 'https://support-ticket-backend-v1.onrender.com'

export default function SupportTicketForm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const client = searchParams.get('client') || ''

  const [storeName, setStoreName] = useState('')
  const [multipleScreens, setMultipleScreens] = useState(false)
  const [screens, setScreens] = useState([{ name: '', description: '', otherDescription: '', photo: null, preview: null }])
  const [contactName, setContactName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [ticketSubmitted, setTicketSubmitted] = useState(false)
  const [photosUploading, setPhotosUploading] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  // Validation state
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (client) setStoreName(`${client} Test`)
  }, [client])

  // Validation helpers
  const validateEmail = (email) => {
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
  const validatePhone = (phone) => {
    // Basic: digits, spaces, plus, dashes allowed (adjust as needed)
    return /^[\d +()-]{7,}$/.test(phone)
  }

  // Validate all inputs on every change or submit
  const validateForm = () => {
    const newErrors = {}

    if (!storeName.trim()) newErrors.storeName = 'Store name is required'
    if (!contactName.trim()) newErrors.contactName = 'Your name is required'
    if (!contactNumber.trim()) newErrors.contactNumber = 'Contact number is required'
    else if (!validatePhone(contactNumber)) newErrors.contactNumber = 'Invalid phone number'
    if (!contactEmail.trim()) newErrors.contactEmail = 'Email is required'
    else if (!validateEmail(contactEmail)) newErrors.contactEmail = 'Invalid email format'

    screens.forEach((screen, idx) => {
      if (!screen.name.trim()) {
        newErrors[`screenName${idx}`] = 'Screen location is required'
      }
      if (!screen.description) {
        newErrors[`screenDescription${idx}`] = 'Description is required'
      }
      if (screen.description === 'Other' && !screen.otherDescription.trim()) {
        newErrors[`screenOtherDescription${idx}`] = 'Please describe the issue'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleScreenChange = (index, field, value) => {
    const newScreens = [...screens]
    newScreens[index][field] = value
    if (field === 'description' && value !== 'Other') {
      newScreens[index].otherDescription = ''
      delete errors[`screenOtherDescription${index}`]
    }
    setScreens(newScreens)
    setErrors((prev) => {
      const copy = { ...prev }
      delete copy[`screenName${index}`]
      delete copy[`screenDescription${index}`]
      return copy
    })
  }

  const handlePhotoChange = (index, file) => {
    const newScreens = [...screens]
    newScreens[index].photo = file

    // Generate preview
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        newScreens[index].preview = e.target.result
        setScreens([...newScreens])
      }
      reader.readAsDataURL(file)
    } else {
      newScreens[index].preview = null
      setScreens([...newScreens])
    }
  }

  const addScreen = () => {
    setScreens([...screens, { name: '', description: '', otherDescription: '', photo: null, preview: null }])
  }

  const removeScreen = (index) => {
    setScreens(screens.filter((_, i) => i !== index))
    setErrors((prev) => {
      const copy = { ...prev }
      delete copy[`screenName${index}`]
      delete copy[`screenDescription${index}`]
      delete copy[`screenOtherDescription${index}`]
      return copy
    })
  }

  async function createMainItem() {
    if (!storeName.trim()) throw new Error('Store name cannot be empty')

    const columnValuesObj = {
      email_mkssfg0w: { email: contactEmail, text: contactEmail },
      phone_mkssfmma: contactNumber,
      text_mkssz2ke: contactName
    }

    const response = await fetch(`${API_BASE_URL}/create-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId: TICKET_BOARD_ID, itemName: storeName, columnValues: columnValuesObj })
    })

    const result = await response.json()
    if (result.error) throw new Error(result.error)
    if (result.errors) throw new Error(result.errors.map((e) => e.message).join('; '))
    const itemId = result.data?.create_item?.id
    if (!itemId) throw new Error('No item ID returned from create_item mutation')
    return itemId
  }

  async function createSubitem(parentId, screen) {
    const subitemValuesObj = { text_mkss1h6r: screen.description || '' }
    if (screen.description === 'Other') subitemValuesObj.text_mksswvza = screen.otherDescription || ''

    const response = await fetch(`${API_BASE_URL}/create-subitem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentItemId: parentId, itemName: screen.name || 'Unnamed Screen', columnValues: subitemValuesObj })
    })

    const result = await response.json()
    if (result.error) throw new Error(result.error)
    if (result.errors) throw new Error(result.errors.map((e) => e.message).join('; '))
    const subitemId = result.data?.create_subitem?.id
    if (!subitemId) throw new Error('No item ID returned from create_subitem mutation')
    return subitemId
  }

  async function uploadPhoto(subitemId, file) {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    const columnId = 'file_mksszjy2'

    const response = await fetch(`${API_BASE_URL}/upload?item_id=${subitemId}&column_id=${columnId}`, { method: 'POST', body: formData })
    const result = await response.json()
    if (result.errors) throw new Error(result.errors.map((e) => e.message).join('; '))
    return result
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      toast({
        title: 'Validation errors',
        description: 'Please fix the errors before submitting',
        status: 'error',
        duration: 4000,
        isClosable: true
      })
      return
    }
    onOpen()
    try {
      const mainItemId = await createMainItem()
      const subitems = []
      for (const screen of screens) {
        const subitemId = await createSubitem(mainItemId, screen)
        subitems.push({ id: subitemId, photo: screen.photo })
      }
      setTicketSubmitted(true)
      setPhotosUploading(true)
      await Promise.all(subitems.filter(({ photo }) => photo).map(({ id, photo }) => uploadPhoto(id, photo)))
      setPhotosUploading(false)
    } catch (err) {
      toast({ title: 'Ticket submission failed.', description: 'Check console for details.', status: 'error', duration: 6000, isClosable: true })
      console.error('Ticket error:', err)
      setTicketSubmitted(false)
    } finally {
      onClose()
    }
  }

  const inputProps = {
    bg: '#222',
    color: 'white',
    borderColor: '#444',
    _placeholder: { color: '#888' },
    borderRadius: 'md'
  }

  const descriptionInputProps = {
    bg: '#ddd',
    color: 'black',
    borderColor: '#999',
    _placeholder: { color: '#555' },
    borderRadius: 'md'
  }

  if (ticketSubmitted) {
    return (
      <Center py={20} bg="#fb6520" minH="100vh">
        <VStack spacing={6}>
          <Text fontSize="3xl" fontWeight="bold" color="white">
            ✅ Ticket Submitted
          </Text>
          {photosUploading && (
            <HStack spacing={2}>
              <Spinner size="sm" color="white" />
              <Text color="white">Uploading photos…</Text>
            </HStack>
          )}
          <Button colorScheme="blue" onClick={() => window.location.reload()} isDisabled={photosUploading}>
            Submit Another
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} isDisabled={photosUploading}>
            Close Portal
          </Button>
        </VStack>
      </Center>
    )
  }

  return (
    <>
      <Center py={10} bg="#fb6520" minH="100vh">
        <Box maxW="600px" w="100%" p={8} bg="black" boxShadow="lg" borderRadius="lg">
          <form onSubmit={handleSubmit} noValidate>
            <VStack spacing={5} align="stretch" color="white">
              <FormControl isInvalid={!!errors.storeName} isRequired>
                <FormLabel>
                  <Icon as={FiMonitor} mr={2} />
                  Store Name
                </FormLabel>
                <Input {...inputProps} value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Enter store name" />
                <FormErrorMessage>{errors.storeName}</FormErrorMessage>
              </FormControl>

              <Checkbox isChecked={multipleScreens} onChange={(e) => setMultipleScreens(e.target.checked)} colorScheme="orange">
                Multiple Screens
              </Checkbox>

              {screens.map((screen, idx) => (
                <Box key={idx} p={4} borderWidth="1px" borderRadius="md" borderColor="#333" bg="#111" mb={4}>
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="semibold">Screen {idx + 1}</Text>
                    {screens.length > 1 && (
                      <Button size="xs" colorScheme="red" onClick={() => removeScreen(idx)}>
                        <Icon as={FiTrash2} />
                      </Button>
                    )}
                  </HStack>

                  <FormControl isInvalid={!!errors[`screenName${idx}`]} isRequired mb={3}>
                    <FormLabel>Screen Location</FormLabel>
                    <Input
                      {...inputProps}
                      value={screen.name}
                      onChange={(e) => handleScreenChange(idx, 'name', e.target.value)}
                      placeholder="e.g. Entrance Left"
                    />
                    <FormErrorMessage>{errors[`screenName${idx}`]}</FormErrorMessage>
                  </FormControl>

                  <FormControl isInvalid={!!errors[`screenDescription${idx}`]} isRequired mb={3}>
                    <FormLabel>Issue Description</FormLabel>
                    <Select
                      {...descriptionInputProps}
                      value={screen.description}
                      onChange={(e) => handleScreenChange(idx, 'description', e.target.value)}
                      placeholder="Select issue"
                    >
                      {DESCRIPTION_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </Select>
                    <FormErrorMessage>{errors[`screenDescription${idx}`]}</FormErrorMessage>
                    {screen.description === 'Other' && (
                      <FormControl isInvalid={!!errors[`screenOtherDescription${idx}`]} isRequired mt={2}>
                        <Textarea
                          {...descriptionInputProps}
                          placeholder="Describe issue…"
                          value={screen.otherDescription}
                          onChange={(e) => handleScreenChange(idx, 'otherDescription', e.target.value)}
                        />
                        <FormErrorMessage>{errors[`screenOtherDescription${idx}`]}</FormErrorMessage>
                      </FormControl>
                    )}
                  </FormControl>

                  <FormControl mb={3}>
                    <FormLabel>
                      <Icon as={FiUpload} mr={2} />
                      Photo
                    </FormLabel>
                    <Input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handlePhotoChange(idx, e.target.files[0])}
                      {...inputProps}
                    />
                    {screen.preview && (
                      <Image
                        src={screen.preview}
                        alt={`Preview screen ${idx + 1}`}
                        maxH="150px"
                        mt={2}
                        borderRadius="md"
                        objectFit="contain"
                      />
                    )}
                  </FormControl>
                </Box>
              ))}

              {multipleScreens && (
                <Button leftIcon={<FiPlus />} onClick={addScreen} colorScheme="blue" size="sm">
                  Add Screen
                </Button>
              )}

              <FormControl isInvalid={!!errors.contactName} isRequired>
                <FormLabel>
                  <Icon as={FiUser} mr={2} />
                  Your Name
                </FormLabel>
                <Input {...inputProps} value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Full name" />
                <FormErrorMessage>{errors.contactName}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.contactNumber} isRequired>
                <FormLabel>
                  <Icon as={FiPhone} mr={2} />
                  Contact Number
                </FormLabel>
                <Input {...inputProps} value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="Phone number" />
                <FormErrorMessage>{errors.contactNumber}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.contactEmail} isRequired>
                <FormLabel>
                  <Icon as={FiMail} mr={2} />
                  Email Address
                </FormLabel>
                <Input {...inputProps} type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Email address" />
                <FormErrorMessage>{errors.contactEmail}</FormErrorMessage>
              </FormControl>

              <Button type="submit" colorScheme="green" size="lg" mt={2} isFullWidth>
                Submit Ticket
              </Button>
            </VStack>
          </form>
        </Box>
      </Center>

      <Modal isOpen={isOpen} onClose={() => {}} isCentered closeOnOverlayClick={false} closeOnEsc={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Submitting Ticket</ModalHeader>
          <ModalBody pb={6}>
            <Progress size="xs" isIndeterminate />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
