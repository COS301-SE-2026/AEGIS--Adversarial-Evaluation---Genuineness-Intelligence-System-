import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from '../page';

// integration test for Resgister Component.

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: mockPush,
	}),
}));

global.fetch = jest.fn(() =>
	Promise.resolve({
		ok: true,
		json: () => Promise.resolve({ access_token: 'test_token', role: 'user' }),
	})
) as jest.Mock;

describe('Register Component', () => {
	beforeEach(() => {
		jest.clearAllMocks();
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

	it('should allow a user to sign up successfully', async () => {
		render(<Register />);

		const emailInput = screen.getByPlaceholderText('Enter your email');
		const passwordInput = screen.getByPlaceholderText('Enter your password');
		const confirmInput = screen.getByPlaceholderText('Re enter your password');
		const signUpButton = screen.getByRole('button', { name: /Sign Up/i });

		await userEvent.type(emailInput, 'test@example.com');
		await userEvent.type(passwordInput, 'Password1!');
		await userEvent.type(confirmInput, 'Password1!');
		await userEvent.click(signUpButton);

		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/auth/register'),
				expect.objectContaining({
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: 'test@example.com',
						password: 'Password1!',
					}),
				})
			);
		});

		await waitFor(() => {
			expect(localStorage.setItem).toHaveBeenCalledWith('aegis_token', 'test_token');
			expect(localStorage.setItem).toHaveBeenCalledWith('aegis_role', 'user');
		});

		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith('/assessment');
		});
	});

	it('should show an error message on failed signup', async () => {
		(global.fetch as jest.Mock).mockImplementationOnce(() =>
			Promise.resolve({
				ok: false,
				json: () => Promise.resolve({ detail: 'Registration failed' }),
			})
		);

		render(<Register />);

		const emailInput = screen.getByPlaceholderText('Enter your email');
		const passwordInput = screen.getByPlaceholderText('Enter your password');
		const confirmInput = screen.getByPlaceholderText('Re enter your password');
		const signUpButton = screen.getByRole('button', { name: /Sign Up/i });

		await userEvent.type(emailInput, 'test@example.com');
		await userEvent.type(passwordInput, 'Password1!');
		await userEvent.type(confirmInput, 'Password1!');
		await userEvent.click(signUpButton);

		await waitFor(() => {
			expect(screen.getByText('Registration failed')).toBeInTheDocument();
		});

		expect(localStorage.setItem).not.toHaveBeenCalled();
		expect(mockPush).not.toHaveBeenCalled();
	});

	it('should show validation errors for empty fields', async () => {
		render(<Register />);
		const signUpButton = screen.getByRole('button', { name: /Sign Up/i });

		await userEvent.click(signUpButton);

		await waitFor(() => {
			expect(screen.getByText('Email is required.')).toBeInTheDocument();
			expect(screen.getByText('Password is required.')).toBeInTheDocument();
			expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
		});
	});
});
