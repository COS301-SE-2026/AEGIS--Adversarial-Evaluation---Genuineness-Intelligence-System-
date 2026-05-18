export const validateEmail = (email: string) : string|null =>{
    if (!email) return "Email is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email format."
    return null;
};

export const validatePassword = (pass: string) : string|null =>{
    if (!pass) return "Password is required."
    if (pass.length < 8) "Password must be at least 8 characters long."

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(pass)) return "Password must contain uppercase, lowercase, number, and special character";
    return null;
}