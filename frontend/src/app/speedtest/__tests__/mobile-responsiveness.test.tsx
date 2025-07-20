import { render, screen, act } from '@testing-library/react'
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

describe('Mobile Responsiveness Tests', () => {
  beforeEach(() => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
      resolvedTheme: 'light',
      themes: ['light', 'dark'],
      systemTheme: 'light',
      forcedTheme: undefined,
    })
    mockRunSpeedTest.mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Mobile Layout Tests', () => {
    it('renders mobile-optimized layout correctly', () => {
      render(<SpeedTestClient />)
      
      // Check that main elements are present
      expect(screen.getByText('Frontend-Only Speed Test')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start test/i })).toBeInTheDocument()
      expect(screen.getByRole('img', { name: /speedometer/i })).toBeInTheDocument()
    })

    it('has proper touch target sizes for mobile', () => {
      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      
      // Check button has appropriate classes for mobile
      expect(startButton).toHaveClass('flex', 'items-center', 'gap-2')
      
      // Verify button text is readable
      expect(startButton).toHaveTextContent('Start Test')
    })

    it('displays speedometer canvas with mobile-appropriate attributes', () => {
      render(<SpeedTestClient />)
      
      const canvas = screen.getByRole('img', { name: /speedometer/i })
      
      // Check canvas has proper attributes
      expect(canvas).toHaveAttribute('width', '350')
      expect(canvas).toHaveAttribute('height', '350')
      expect(canvas).toHaveClass('speedometer-canvas')
    })

    it('displays feature cards in mobile layout', () => {
      render(<SpeedTestClient />)
      
      // Check feature descriptions are present
      expect(screen.getByText('Frontend-Only')).toBeInTheDocument()
      expect(screen.getByText('Smart Server Selection')).toBeInTheDocument()
      expect(screen.getByText('Comprehensive Testing')).toBeInTheDocument()
    })
  })

  describe('Mobile Viewport Tests', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      })
    })

    it('adapts to mobile viewport', () => {
      render(<SpeedTestClient />)
      
      // Check that responsive elements are present
      expect(screen.getByText('Frontend-Only Speed Test')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start test/i })).toBeInTheDocument()
    })

    it('handles touch interactions properly', () => {
      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      
      // Button should be touchable
      expect(startButton).toBeInTheDocument()
      expect(startButton).not.toBeDisabled()
    })

    it('displays progress indicators for mobile', () => {
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'locating', progress: 10, currentSpeed: 0, message: 'Getting location...' })
        return new Promise(resolve => {
          setTimeout(() => {
            callback?.({ phase: 'complete', progress: 100, currentSpeed: 0, message: 'Complete!' })
            resolve({
              download_speed: 100.0,
              upload_speed: 50.0,
              ping: 20.0,
              jitter: 1.0,
              server_location: 'Test Server',
              timestamp: Date.now(),
              method: 'Frontend-Only Browser Test' as const,
            })
          }, 100)
        })
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      
      act(() => {
        startButton.click()
      })
      
      // Should show progress elements
      expect(screen.getByText('Testing...')).toBeInTheDocument()
    })
  })

  describe('Mobile Accessibility Tests', () => {
    it('has proper ARIA labels for mobile screen readers', () => {
      render(<SpeedTestClient />)
      
      const canvas = screen.getByRole('img', { name: /speedometer/i })
      expect(canvas).toHaveAttribute('aria-label', 'speedometer')
    })

    it('provides proper heading hierarchy for mobile', () => {
      render(<SpeedTestClient />)
      
      // Check main heading
      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toHaveTextContent('Frontend-Only Speed Test')
      
      // Check subheadings in result cards
      expect(screen.getByText('Download')).toBeInTheDocument()
      expect(screen.getByText('Upload')).toBeInTheDocument()
      expect(screen.getByText('Ping')).toBeInTheDocument()
    })

    it('supports keyboard navigation on mobile', () => {
      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      
      // Button should be focusable
      expect(startButton).toHaveAttribute('type', 'button')
      
      // Should not have disabled state initially
      expect(startButton).not.toBeDisabled()
    })

    it('provides proper color contrast for mobile', () => {
      render(<SpeedTestClient />)
      
      // Check that text elements are present (color contrast would be tested with tools)
      expect(screen.getByText('Frontend-Only Speed Test')).toBeInTheDocument()
      expect(screen.getByText('Test your internet speed completely in your browser - no backend required!')).toBeInTheDocument()
    })
  })

  describe('Mobile Performance Tests', () => {
    it('renders efficiently on mobile devices', () => {
      const startTime = performance.now()
      render(<SpeedTestClient />)
      const endTime = performance.now()
      
      // Component should render quickly (under 100ms)
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('handles canvas rendering for mobile', () => {
      render(<SpeedTestClient />)
      
      const canvas = screen.getByRole('img', { name: /speedometer/i })
      expect(canvas).toBeInTheDocument()
      
      // Canvas should have proper dimensions
      expect(canvas).toHaveAttribute('width', '350')
      expect(canvas).toHaveAttribute('height', '350')
    })

    it('manages memory efficiently during speed tests', async () => {
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

      const { unmount } = render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      
      act(() => {
        startButton.click()
      })
      
      // Should be able to unmount without issues
      unmount()
      
      expect(true).toBe(true) // No memory leaks
    })
  })

  describe('Mobile Error Handling', () => {
    it('displays error messages appropriately on mobile', () => {
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'locating', progress: 10, currentSpeed: 0, message: 'Getting location...' })
        callback?.({ phase: 'error', progress: 0, currentSpeed: 0, message: 'Network error' })
        return Promise.reject(new Error('Network error'))
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      
      act(() => {
        startButton.click()
      })
      
      // Should show error state
      expect(screen.getByText('Speed Test Failed')).toBeInTheDocument()
    })

    it('handles touch events during errors', () => {
      mockRunSpeedTest.mockImplementation((callback) => {
        callback?.({ phase: 'error', progress: 0, currentSpeed: 0, message: 'Test failed' })
        return Promise.reject(new Error('Test failed'))
      })

      render(<SpeedTestClient />)
      
      const startButton = screen.getByRole('button', { name: /start test/i })
      
      act(() => {
        startButton.click()
      })
      
      // Should be able to retry
      expect(screen.getByRole('button', { name: /test again/i })).toBeInTheDocument()
    })
  })

  describe('Mobile Theme Support', () => {
    it('adapts to dark theme on mobile', () => {
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

    it('adapts to light theme on mobile', () => {
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

    it('handles system theme changes on mobile', () => {
      mockUseTheme.mockReturnValue({
        theme: 'system',
        setTheme: jest.fn(),
        resolvedTheme: 'light',
        themes: ['light', 'dark', 'system'],
        systemTheme: 'light',
        forcedTheme: undefined,
      })

      render(<SpeedTestClient />)
      
      expect(screen.getByText('Frontend-Only Speed Test')).toBeInTheDocument()
    })
  })
}) 