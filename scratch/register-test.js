async function run() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'supertest@gmail.com',
        name: 'Super Test User',
        password: 'password123'
      })
    });
    const result = await response.json();
    console.log("Registration Response:", result);
  } catch (error) {
    console.error("Error registering user:", error);
  }
}

run();
