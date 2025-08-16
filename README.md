# AI Resume Screener - Frontend 🚀

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

This is the official frontend for the **AI Resume Screener MLOps Project**. It provides a clean, intuitive, and responsive user interface for recruiters and HR professionals to interact with the powerful machine learning backend.

Users can easily upload or paste resume content and receive instant, AI-powered analysis, including role predictions and actionable feedback for improvement.

**➡️ Backend Repository:** For all details on the MLOps pipeline, model training, and API, please see the [**Backend README**](httpss://github.com/mirdanish6594/Resume-Screener).

---
## ✨ Features

This interface brings the backend's capabilities to life, allowing users to:

* **Seamless Resume Upload:** Upload PDF resumes using a modern drag-and-drop interface or a standard file browser.
* **Direct Text Input:** Paste resume content directly into a text area for quick analysis.
* **Instant Role Prediction:** Get an immediate prediction for the most suitable job role based on the resume's content, complete with a confidence score.
* **Comprehensive AI Analysis:** View a detailed breakdown of the resume, including:
    * **Overall Resume Score:** A metric-based score out of 100.
    * **Key Strengths:** AI-identified strengths that make the candidate stand out.
    * **Actionable Improvements:** Specific, prioritized suggestions to enhance the resume, categorized by area (e.g., Technical Skills, Impact & Results).
    * **Areas to Develop:** Highlights key elements that may be missing, such as version control experience or quantifiable achievements.



---
## 🛠️ Tech Stack

This project is built with a modern, fast, and type-safe technology stack:

* **Framework:** [React](httpss://reactjs.org/)
* **Build Tool:** [Vite](httpss://vitejs.dev/)
* **Language:** [TypeScript](httpss://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](httpss://tailwindcss.com/)
* **Client-Side PDF Parsing:** [pdf.js](httpss://mozilla.github.io/pdf.js/)
* **Icons:** [Lucide React](httpss://lucide.dev/)
* **API Communication:** [Fetch API](httpss://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

---
## 🚀 Getting Started

Follow these instructions to get the frontend running on your local machine for development and testing.

### Prerequisites

* Node.js (v18 or later recommended)
* npm or yarn
* A running instance of the [**backend server**](httpss://github.com/mirdanish6594/Resume-Screener).

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/YOUR_FRONTEND_REPO_NAME.git](https://github.com/YOUR_USERNAME/YOUR_FRONTEND_REPO_NAME.git)
    cd YOUR_FRONTEND_REPO_NAME
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure the Backend Connection:**
    The frontend needs to know the address of the backend API.
    Create a new file named `.env` in the root of the project directory and add the following line:

    ```env
    VITE_API_BASE_URL=[http://127.0.0.1:8000](http://127.0.0.1:8000)
    ```
    *Note: Replace `http://127.0.0.1:8000` with the actual URL where your backend is running.*

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running on `http://localhost:5173`.

---
## 📂 Project Structure

The project follows a standard Vite + React structure:

RESUME-SCREENER-FRONTEND/
└── src/
    ├── api/
    │   └── screenerAPI.tsx  <-- Your API logic lives here
    ├── components/
    │   └── ResumeForm.tsx   <-- Your component lives here
    ├── types/
    │   └── types.ts         <-- Your types live here
    ├── App.tsx
    └── ... other files


---
## 🤝 Contributing

Contributions are welcome! If you have suggestions or want to improve the UI/UX, please follow these steps:

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/AmazingFeature`).
3.  Make your changes and commit them (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---
## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---
## 📧 Contact

**Danish Mir** - Feel free to reach out with any questions or collaboration ideas!
