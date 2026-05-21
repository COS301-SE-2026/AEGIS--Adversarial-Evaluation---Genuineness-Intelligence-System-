import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../page';

// integration test for Login Component.

// Mock the useRouter hook
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ access_token: 'test_token', role: 'user' }),
  })
) as jest.Mock;

describe('Login Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  it('should allow a user to log in successfully', async () => {
    render(<Login />);

    // Find form elements
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const signInButton = screen.getByRole('button', { name: /Sign In/i });

    // Initially, the button should be enabled
    expect(signInButton).toBeEnabled();

    // Simulate user typing
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'Password123!');

    // Check if the inputs have the correct values
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('Password123!');

    // Click the sign-in button
    await userEvent.click(signInButton);

    // Wait for the submission to complete
    await waitFor(() => {
      // Check if fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'Password123!',
          }),
        })
      );
    });

    // Check if localStorage was updated
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('aegis_token', 'test_token');
      expect(localStorage.setItem).toHaveBeenCalledWith('aegis_role', 'user');
    });

    // Check if the user is redirected
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/assessment');
    });
  });

  it('should show an error message on failed login', async () => {
    // Mock a failed API response
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ detail: 'Invalid credentials' }),
      })
    );

    render(<Login />);

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const signInButton = screen.getByRole('button', { name: /Sign In/i });

    await userEvent.type(emailInput, 'wrong@example.com');
    await userEvent.type(passwordInput, 'Wrongpassword12!');
    await userEvent.click(signInButton);

    // Check for server error message
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });

    // Ensure no redirection or localStorage setting
    expect(localStorage.setItem).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should show validation errors for empty fields', async () => {
    render(<Login />);
    const signInButton = screen.getByRole('button', { name: /Sign In/i });

    await userEvent.click(signInButton);

    // Check for validation error messages
    await waitFor(() => {
      expect(screen.getByText('Email is required.')).toBeInTheDocument();
      expect(screen.getByText('Password is required.')).toBeInTheDocument();
    });
  });
});
