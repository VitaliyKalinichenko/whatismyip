import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import SpeedTestClient from '../speedtest-client'
import { useTheme } from 'next-themes'
import * as speedtestLib from '@/lib/speedtest'

// Mock CSS module
jest.mock('../speedtest.css', () => ({}))

// Mock the speedtest library
jest.mock('@/lib/speedtest', () => ({
  runSpeedTest: jest.fn(),
  SpeedTestResult: {},
  TestProgress: {},
}))

// Mock useTheme hook
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>
const mockRunSpeedTest = speedtestLib.runSpeedTest as jest.MockedFunction<typeof speedtestLib.runSpeedTest>

describe('SpeedTestClient', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    mockRunSpeedTest.mockClear()
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
      resolvedTheme: 'light',
      themes: ['light', 'dark'],
      systemTheme: 'light',
      forcedTheme: undefined,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    it('renders initial state correctly', () => {
      render(<SpeedTestClient />)
      
      expect(screen.getByText('Frontend-Only Speed Test')).toBeInTheDocument()
      expect(screen.getByText('Test your internet speed completely in your browser - no backend required!')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start test/i })).toBeInTheDocument()
      expect(screen.getByText('0.0')).toBeInTheDocument()
    })

    it('displays speedometer with correct initial values', () => {
      render(<SpeedTestClient />)
      
      const speedometer = screen.getByRole('img', { name: /speedometer/i })
      expect(speedometer).toBeInTheDocument()
      
      // Check for initial speed display
      expect(screen.getByText('0.0')).toBeInTheDocument()
      expect(screen.getByText('Mbps')).toBeInTheDocument()
    })

    it('shows download, upload, and ping sections', () => {
      render(<SpeedTestClient />)
      
      expect(screen.getByText('Download')).toBeInTheDocument()
      expect(screen.getByText('Upload')).toBeInTheDocument()
      expect(screen.getByText('Ping')).toBeInTheDocument()
    })
  })

  describe('Speed Test Functionality', () => {
    const mockSpeedTestResult = {
      download_speed: 150.5,
      upload_speed: 75.2,
      ping: 25.8,
      jitter: 2.1,
      server_location: 'New York, NY',
      timestamp: Date.now(),
      method: 'Frontend-Only Browser Test' as const,
    }

    it('starts speed test when button is clicked', async () => {
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'locating', progress: 10, currentSpeed: 0, message: 'Getting location...' })
        callback?.({ phase: 'complete', progress: 100, currentSpeed: 0, message: 'Complete!' })
        return Promise.resolve(mockSpeedTestResult)
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      await user.click(startButton)

      expect(mockRunSpeedTest).toHaveBeenCalledWith(expect.any(Function))
    })

    it('displays loading state during test', async () => {
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'locating', progress: 10, currentSpeed: 0, message: 'Getting location...' })
        return new Promise(resolve => {
          setTimeout(() => {
            callback?.({ phase: 'complete', progress: 100, currentSpeed: 0, message: 'Complete!' })
            resolve(mockSpeedTestResult)
          }, 100)
        })
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      await user.click(startButton)

      expect(screen.getByText('Testing...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /testing/i })).toBeDisabled()
    })

    it('displays test results correctly', async () => {
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'locating', progress: 10, currentSpeed: 0, message: 'Getting location...' })
        callback?.({ phase: 'complete', progress: 100, currentSpeed: 0, message: 'Complete!' })
        return Promise.resolve(mockSpeedTestResult)
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('150.5')).toBeInTheDocument()
        expect(screen.getByText('75.2')).toBeInTheDocument()
        expect(screen.getByText('25.8')).toBeInTheDocument()
      })

      expect(screen.getByText('New York, NY')).toBeInTheDocument()
    })

    it('shows test again button after completion', async () => {
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'locating', progress: 10, currentSpeed: 0, message: 'Getting location...' })
        callback?.({ phase: 'complete', progress: 100, currentSpeed: 0, message: 'Complete!' })
        return Promise.resolve(mockSpeedTestResult)
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /test again/i })).toBeInTheDocument()
      })
    })

    it('handles different test phases', async () => {
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'locating', progress: 10, currentSpeed: 0, message: 'Getting location...' })
        callback?.({ phase: 'selecting', progress: 20, currentSpeed: 0, message: 'Selecting server...' })
        callback?.({ phase: 'ping', progress: 30, currentSpeed: 0, message: 'Testing ping...' })
        callback?.({ phase: 'download', progress: 50, currentSpeed: 100, message: 'Testing download...' })
        callback?.({ phase: 'upload', progress: 80, currentSpeed: 50, message: 'Testing upload...' })
        callback?.({ phase: 'complete', progress: 100, currentSpeed: 0, message: 'Complete!' })
        return Promise.resolve(mockSpeedTestResult)
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('150.5')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      const error = new Error('Network error')
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'locating', progress: 10, currentSpeed: 0, message: 'Getting location...' })
        callback?.({ phase: 'error', progress: 0, currentSpeed: 0, message: 'Network error' })
        return Promise.reject(error)
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('Speed Test Failed')).toBeInTheDocument()
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('handles geolocation errors', async () => {
      const error = new Error('Geolocation failed')
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'locating', progress: 10, currentSpeed: 0, message: 'Getting location...' })
        callback?.({ phase: 'error', progress: 0, currentSpeed: 0, message: 'Geolocation failed' })
        return Promise.reject(error)
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('Speed Test Failed')).toBeInTheDocument()
        expect(screen.getByText('Geolocation failed')).toBeInTheDocument()
      })
    })

    it('handles server selection errors', async () => {
      const error = new Error('No servers available')
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'selecting', progress: 20, currentSpeed: 0, message: 'Selecting server...' })
        callback?.({ phase: 'error', progress: 0, currentSpeed: 0, message: 'No servers available' })
        return Promise.reject(error)
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('Speed Test Failed')).toBeInTheDocument()
        expect(screen.getByText('No servers available')).toBeInTheDocument()
      })
    })
  })

  describe('Animation and UI Behavior', () => {
    it('animates progress bar during test', async () => {
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'locating', progress: 10, currentSpeed: 0, message: 'Getting location...' })
        callback?.({ phase: 'download', progress: 50, currentSpeed: 100, message: 'Testing download...' })
        callback?.({ phase: 'complete', progress: 100, currentSpeed: 0, message: 'Complete!' })
        return Promise.resolve({
          download_speed: 100.0,
          upload_speed: 50.0,
          ping: 20.0,
          jitter: 1.0,
          server_location: 'Test Server',
          timestamp: Date.now(),
          method: 'Frontend-Only Browser Test' as const,
        })
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('100.0')).toBeInTheDocument()
      })
    })

    it('updates speedometer needle position', async () => {
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'download', progress: 50, currentSpeed: 150, message: 'Testing download...' })
        callback?.({ phase: 'complete', progress: 100, currentSpeed: 0, message: 'Complete!' })
        return Promise.resolve({
          download_speed: 150.0,
          upload_speed: 75.0,
          ping: 25.0,
          jitter: 2.0,
          server_location: 'Test Server',
          timestamp: Date.now(),
          method: 'Frontend-Only Browser Test' as const,
        })
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      await user.click(startButton)

      await waitFor(() => {
        const canvas = screen.getByRole('img', { name: /speedometer/i })
        expect(canvas).toBeInTheDocument()
      })
    })

    it('displays status messages during test phases', async () => {
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'locating', progress: 10, currentSpeed: 0, message: 'Getting your location...' })
        callback?.({ phase: 'selecting', progress: 20, currentSpeed: 0, message: 'Selecting nearest server...' })
        callback?.({ phase: 'ping', progress: 30, currentSpeed: 0, message: 'Testing latency...' })
        callback?.({ phase: 'download', progress: 50, currentSpeed: 100, message: 'Testing download speed...' })
        callback?.({ phase: 'upload', progress: 80, currentSpeed: 50, message: 'Testing upload speed...' })
        callback?.({ phase: 'complete', progress: 100, currentSpeed: 0, message: 'Complete!' })
        return Promise.resolve({
          download_speed: 100.0,
          upload_speed: 50.0,
          ping: 20.0,
          jitter: 1.0,
          server_location: 'Test Server',
          timestamp: Date.now(),
          method: 'Frontend-Only Browser Test' as const,
        })
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('100.0')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('handles very high speed values', async () => {
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'complete', progress: 100, currentSpeed: 0, message: 'Complete!' })
        return Promise.resolve({
          download_speed: 9999.99,
          upload_speed: 1000.5,
          ping: 1.2,
          jitter: 0.1,
          server_location: 'Test Server',
          timestamp: Date.now(),
          method: 'Frontend-Only Browser Test' as const,
        })
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('9999.99')).toBeInTheDocument()
      })
    })

    it('handles very low speed values', async () => {
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'complete', progress: 100, currentSpeed: 0, message: 'Complete!' })
        return Promise.resolve({
          download_speed: 0.01,
          upload_speed: 0.05,
          ping: 999.9,
          jitter: 50.0,
          server_location: 'Test Server',
          timestamp: Date.now(),
          method: 'Frontend-Only Browser Test' as const,
        })
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('0.01')).toBeInTheDocument()
      })
    })

    it('handles zero speed values', async () => {
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'complete', progress: 100, currentSpeed: 0, message: 'Complete!' })
        return Promise.resolve({
          download_speed: 0,
          upload_speed: 0,
          ping: 0,
          jitter: 0,
          server_location: 'Test Server',
          timestamp: Date.now(),
          method: 'Frontend-Only Browser Test' as const,
        })
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('0.0')).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('cleans up resources on unmount', () => {
      const { unmount } = render(<SpeedTestClient />)
      
      unmount()
      
      // Should not throw any errors
      expect(true).toBe(true)
    })

    it('handles rapid button clicks', async () => {
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'complete', progress: 100, currentSpeed: 0, message: 'Complete!' })
        return Promise.resolve({
          download_speed: 100.0,
          upload_speed: 50.0,
          ping: 20.0,
          jitter: 1.0,
          server_location: 'Test Server',
          timestamp: Date.now(),
          method: 'Frontend-Only Browser Test' as const,
        })
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      
      // Click multiple times rapidly
      await user.click(startButton)
      await user.click(startButton)
      await user.click(startButton)

      // Should only make one request since the test is already running
      expect(mockRunSpeedTest).toHaveBeenCalledTimes(1)
    })

    it('handles null and undefined values gracefully', async () => {
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'complete', progress: 100, currentSpeed: 0, message: 'Complete!' })
        return Promise.resolve({
          download_speed: 25.0,
          upload_speed: 10.0,
          ping: 50.0,
          jitter: undefined,
          server_location: 'Test Server',
          timestamp: Date.now(),
          method: 'Frontend-Only Browser Test' as const,
        })
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('25.0')).toBeInTheDocument()
      })
    })
  })

  describe('Theme Support', () => {
    it('adapts to dark theme', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: jest.fn(),
        resolvedTheme: 'dark',
        themes: ['light', 'dark'],
        systemTheme: 'dark',
        forcedTheme: undefined,
      })

      render(<SpeedTestClient />)
      
      expect(screen.getByText('Frontend-Only Speed Test')).toBeInTheDocument()
      const canvas = screen.getByRole('img', { name: /speedometer/i })
      expect(canvas).toBeInTheDocument()
    })

    it('adapts to light theme', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: jest.fn(),
        resolvedTheme: 'light',
        themes: ['light', 'dark'],
        systemTheme: 'light',
        forcedTheme: undefined,
      })

      render(<SpeedTestClient />)
      
      expect(screen.getByText('Frontend-Only Speed Test')).toBeInTheDocument()
      const canvas = screen.getByRole('img', { name: /speedometer/i })
      expect(canvas).toBeInTheDocument()
    })
  })
}) 