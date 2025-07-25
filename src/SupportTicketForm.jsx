import { useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
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
  FormErrorMessage,
  Collapse,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { FiMonitor, FiUpload, FiPlus, FiTrash2, FiUser, FiPhone, FiMail } from 'react-icons/fi'

const COMPANY_LOGO_URL = 'https://via.placeholder.com/150x50?text=Company+Logo'
const COMPANY_NAME = "InteractiveMedia"
const SUPPORT_EMAIL = "Support"
const SUPPORT_PHONE = "021 851 0119"
const BUSINESS_HOURS = "Monday-Friday: 8AM-5PM"
const COMPANY_LOGO_FILENAME = '/Interactive-Media-logo.png'


const DESCRIPTION_OPTIONS = [
  'Screen not turning on',
  'Wrong content',
  'Screen on but black screen',
  'Content not updated',
  'No signal',
  'Physical damage',
  'Screen Flickers',
  'Screen showing google verification login',
  'Screen shows invalid response from cms',
  'Screen stolen',
  'Water damage',
  'Other'
]

const TICKET_BOARD_ID = '9575288798'
const API_BASE_URL = 'https://support-ticket-backend-v1.onrender.com'

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(128,128,128, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(128,128,128, 0); }
  100% { box-shadow: 0 0 0 0 rgba(128,128,128, 0); }
`

export default function SupportTicketForm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const client = searchParams.get('client') || ''

  const initialScreens = [{ name: '', description: '', otherDescription: '', photo: null, preview: null }]

  const [storeCode, setStoreCode] = useState('')
  const [storeName, setStoreName] = useState('')
  const [screens, setScreens] = useState(initialScreens)
  const [contactName, setContactName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [ticketSubmitted, setTicketSubmitted] = useState(false)
  const [photosUploading, setPhotosUploading] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (client) {
      setStoreName(`${client} Test`)
      setStoreCode('')
    }
  }, [client])

  const validateEmail = useCallback((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [])

  const validatePhone = useCallback((phone) => {
    const digitsOnly = phone.replace(/\D/g, '')
    return digitsOnly.length >= 7
  }, [])

  const validateForm = useCallback(() => {
    const newErrors = {}

    if (!storeName.trim()) newErrors.storeName = 'Store name is required'
    if (!contactName.trim()) newErrors.contactName = 'Your name is required'
    if (!contactNumber.trim()) newErrors.contactNumber = 'Contact number is required'
    else if (!validatePhone(contactNumber)) newErrors.contactNumber = 'Invalid phone number'
    if (!contactEmail.trim()) newErrors.contactEmail = 'Email is required'
    else if (!validateEmail(contactEmail)) newErrors.contactEmail = 'Invalid email format'

    screens.forEach((screen, idx) => {
  // Only enforce required fields on the first screen
  const isFirst = idx === 0
  if (isFirst || screen.name.trim() || screen.description) {
    if (!screen.name.trim()) newErrors[`screenName${idx}`] = 'Screen location is required'
    if (!screen.description) newErrors[`screenDescription${idx}`] = 'Description is required'
  }
})

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [storeCode, storeName, contactName, contactNumber, contactEmail, screens, validateEmail, validatePhone])

  useEffect(() => {
    if (
      storeCode ||
      storeName ||
      contactName ||
      contactNumber ||
      contactEmail ||
      screens.some(s => s.name || s.description || s.otherDescription)
    ) {
      validateForm()
    }
  }, [storeCode, storeName, contactName, contactNumber, contactEmail, screens, validateForm])

  const handleScreenChange = (index, field, value) => {
    const newScreens = [...screens]
    newScreens[index][field] = value
    setScreens(newScreens)
    setErrors((prev) => {
      const copy = { ...prev }
      delete copy[`screenName${index}`]
      delete copy[`screenDescription${index}`]
      delete copy[`screenOtherDescription${index}`]
      return copy
    })
  }

  const handlePhotoChange = (index, file) => {
    const newScreens = [...screens]
    newScreens[index].photo = file

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
      phone_mkssfmma: contactNumber.replace(/\D/g, ''),
      text_mkssz2ke: contactName,
      text_mksv4188: storeCode
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
    const subitemValuesObj = { 
      text_mkss1h6r: screen.description || '',
      text_mksswvza: screen.otherDescription || ''
    }

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

  const resetForm = () => {
    setTicketSubmitted(false)
    setStoreCode('')
    setStoreName(client ? `${client} Test` : '')
    setMultipleScreens(false)
    setScreens(initialScreens)
    setContactName('')
    setContactNumber('')
    setContactEmail('')
    setErrors({})
  }

  const inputProps = {
  bg: 'white',
  color: 'black',
  borderColor: '#ccc',
  _placeholder: { color: '#666' },
  borderRadius: 'md',
  fontSize: 'md',
  px: 3,
  py: 2,
}

  const descriptionInputProps = {
  bg: 'white',
  color: 'black',
  borderColor: '#ccc',
  _placeholder: { color: '#666' },
  borderRadius: 'md',
  fontSize: 'md',
  px: 3,
  py: 2,
}

if (ticketSubmitted) {
  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-bl, #f8601d, #f2bb39)"
      py={20}
      px={4}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Image
        src={COMPANY_LOGO_FILENAME} // Your logo constant, e.g. '/Interactive-Media-logo.png'
        alt="Company Logo"
        mb={6}
        maxH="60px"
        userSelect="none"
      />
      <VStack spacing={6} maxW="600px" w="100%">
        <Text fontSize="3xl" fontWeight="bold" color="white" userSelect="none">
          ✅ Ticket Submitted
        </Text>
        {photosUploading && (
          <HStack spacing={2}>
            <Spinner size="sm" color="white" />
            <Text color="white">Uploading photos…</Text>
          </HStack>
        )}
       <Button
  bg="black"
  color="white"
  onClick={resetForm}
  isDisabled={photosUploading}
  size="lg"
  w="full"
  mt={4}
  _hover={{ bg: 'gray.800', boxShadow: 'none' }}
  transition="background-color 0.3s ease"
>
  Submit Another
</Button>

        <Button
          variant="outline"
          onClick={() => navigate('/')}
          isDisabled={photosUploading}
          size="lg"
          w="full"
          mt={2}
          _hover={{ bg: 'orange.400', color: 'black' }}
          transition="background-color 0.3s ease"
        >
          Close Portal
        </Button>
      </VStack>
    </Box>
  )
}

  return (
    <>

<Box
  position="sticky"
  top="0"
  zIndex="10"
  bg="white"
  py={4}
  borderBottom="1px solid #333"
  px={4}
>
  <HStack
    maxW="800px"
    mx="auto"
    w="100%"
    justify="space-between"
    align="center"
    spacing={4}
  >
    {/* Left side: stacked logos */}
    <VStack spacing={2} flexShrink={0}>
      <Image
        src="/Imagine-logo.png"
        alt="Logo 1"
        h={{ base: '45px', md: '50px' }}
        objectFit="contain"
      />
      <Image
        src="/Interactive-Media-logo.png"
        alt="Logo 2"
        h={{ base: '18px', md: '50px' }}
        objectFit="contain"
      />
    </VStack>

    {/* Right side: company info */}
    <VStack
      spacing={0}
      align="flex-start"
      flex="1"
      px={2}
    >
      <Text
        fontSize={{ base: 'md', md: 'lg' }}
        fontWeight="bold"
        userSelect="none"
      >
        {COMPANY_NAME}
      </Text>
      <Text
        fontSize={{ base: 'sm', md: 'md' }}
        userSelect="none"
      >
        {SUPPORT_EMAIL}
      </Text>
      <Text
        fontSize={{ base: 'sm', md: 'md' }}
        userSelect="none"
      >
        {SUPPORT_PHONE}
      </Text>
    </VStack>
  </HStack>
</Box>




      <Box minH="100vh" bgGradient="linear(to-bl, #f8601d, #f2bb39)">
  <Center py={10} px={4}>
    <Box maxW="600px" w="100%" p={6} bg="white" color="black" boxShadow="lg" borderRadius="lg">
          <form onSubmit={handleSubmit} noValidate>
            <VStack spacing={5} align="stretch">
              <FormControl isInvalid={!!errors.storeCode}>
                <FormLabel fontWeight="semibold" fontSize="sm">Store Code - if known</FormLabel>
                <Input
                  {...inputProps}
                  value={storeCode}
                  onChange={(e) => setStoreCode(e.target.value)}
                  placeholder="Enter store code"
                  autoComplete="off"
                  spellCheck={false}
                />
                <FormErrorMessage>{errors.storeCode}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.storeName} isRequired>
                <FormLabel>
                  <Icon as={FiMonitor} mr={2} />
                  Store Name
                </FormLabel>
                <Input
                  {...inputProps}
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Enter store name"
                  autoComplete="organization"
                  spellCheck={false}
                />
                <FormErrorMessage>{errors.storeName}</FormErrorMessage>
              </FormControl>


             {screens.length > 0 && screens.map((screen, idx) => (
  <Box
    key={idx}
    p={4}
    borderWidth="1px"
    borderRadius="md"
    borderColor="#ccc"
    bg="white"
    mb={4}
    color="black"
  >
    {/* Top Header and Remove button */}
    <HStack justify="space-between" mb={2}>
      <Text fontWeight="semibold" fontSize="lg">
        Screen {idx + 1}
      </Text>
      {screens.length > 1 && (
        <Button
          size="xs"
          colorScheme="red"
          onClick={() => removeScreen(idx)}
          aria-label={`Remove Screen ${idx + 1}`}
          _hover={{ transform: 'scale(1.15)', boxShadow: '0 0 8px red' }}
          transition="transform 0.2s ease, box-shadow 0.2s ease"
        >
          <Icon as={FiTrash2} />
        </Button>
      )}
    </HStack>

    {/* Screen Location */}
    <FormControl isInvalid={!!errors[`screenName${idx}`]} isRequired mb={3}>
      <FormLabel fontSize="md">Screen Location</FormLabel>
      <Input
        {...inputProps}
        value={screen.name}
        onChange={(e) => handleScreenChange(idx, 'name', e.target.value)}
        placeholder="e.g. Entrance Left"
        autoComplete="off"
        spellCheck={false}
        size="md"
      />
      <FormErrorMessage>{errors[`screenName${idx}`]}</FormErrorMessage>
    </FormControl>

    {/* Description Dropdown */}
    <FormControl isInvalid={!!errors[`screenDescription${idx}`]} isRequired mb={3}>
      <FormLabel fontSize="md">Issue Description</FormLabel>
      <Select
        {...descriptionInputProps}
        value={screen.description}
        onChange={(e) => handleScreenChange(idx, 'description', e.target.value)}
        placeholder="Select issue"
        size="md"
      >
        {DESCRIPTION_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </Select>
      <FormErrorMessage>{errors[`screenDescription${idx}`]}</FormErrorMessage>

      <Collapse in={!!screen.description} animateOpacity>
        <FormControl 
          isInvalid={!!errors[`screenOtherDescription${idx}`]} 
          mt={2}
        >
          <Textarea
            {...descriptionInputProps}
            placeholder={screen.description === 'Other' ? "Describe issue..." : "Add any additional details (optional)..." }
            value={screen.otherDescription}
            onChange={(e) => handleScreenChange(idx, 'otherDescription', e.target.value)}
            size="md"
            rows={3}
          />
          <FormErrorMessage>{errors[`screenOtherDescription${idx}`]}</FormErrorMessage>
        </FormControl>
      </Collapse>
    </FormControl>

    {/* Photo Upload */}
    <FormControl mb={3}>
      <FormLabel fontSize="md">
        <Icon as={FiUpload} mr={2} />
        Photo
      </FormLabel>
      <Input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handlePhotoChange(idx, e.target.files[0])}
        {...inputProps}
        size="md"
      />
      {screen.preview && (
        <Image
          src={screen.preview}
          alt={`Preview screen ${idx + 1}`}
          maxH="150px"
          mt={2}
          borderRadius="md"
          objectFit="contain"
          loading="lazy"
          draggable={false}
          userSelect="none"
        />
      )}
    </FormControl>
  </Box>
))}

              <Button
  leftIcon={<FiPlus />}
  onClick={addScreen}
  colorScheme="blue"
  size="md"
  w="full"
  mt={2}
  _hover={{ transform: 'scale(1.05)', boxShadow: '0 0 8px #3182ce' }}
  transition="transform 0.2s ease"
>
  Add Screen
</Button>
              

              <FormControl isInvalid={!!errors.contactName} isRequired>
                <FormLabel>
                  <Icon as={FiUser} mr={2} />
                  Contact Name
                </FormLabel>
                <Input
                  {...inputProps}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  spellCheck={false}
                />
                <FormErrorMessage>{errors.contactName}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.contactNumber} isRequired>
                <FormLabel>
                  <Icon as={FiPhone} mr={2} />
                  Contact Number
                </FormLabel>
                <Input
                  {...inputProps}
                  value={contactNumber}
                  onChange={(e) => {
                    const rawValue = e.target.value
                    const sanitized = rawValue.replace(/[^\d+]/g, '')
                    setContactNumber(sanitized)
                    setErrors((prev) => {
                      const copy = { ...prev }
                      delete copy.contactNumber
                      return copy
                    })
                  }}
                  placeholder="Phone number"
                  autoComplete="tel"
                  spellCheck={false}
                />
                <FormErrorMessage>{errors.contactNumber}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.contactEmail} isRequired>
                <FormLabel>
                  <Icon as={FiMail} mr={2} />
                  Email Address
                </FormLabel>
                <Input
                  {...inputProps}
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="Your email"
                  autoComplete="email"
                  spellCheck={false}
                />
                <FormErrorMessage>{errors.contactEmail}</FormErrorMessage>
              </FormControl>

              <Button
  type="submit"
  bg="black"
  color="white"
  size="lg"
  w="full"
  mt={4}
  animation={`${pulse} 2s infinite`}
  _hover={{ bg: 'gray.800', boxShadow: 'none', animation: 'none' }}
>
  Submit Ticket
</Button>

            </VStack>
          </form>
        </Box>
      </Center>
      </Box>
      <Modal isOpen={isOpen} onClose={onClose} isCentered closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent bg="black">
          <ModalHeader color="white">Submitting Ticket...</ModalHeader>
          <ModalBody>
            <Progress size="xs" isIndeterminate colorScheme="green" />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}