import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <section className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white">
      <h1 className="text-5xl font-extrabold mb-6 drop-shadow-lg">
        Attendance 2.0
      </h1>
      <p className="text-lg mb-8 max-w-md text-center">
      </p>
      <button
        onClick={() => navigate("/home")}
        className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:bg-gray-100 transition"
      >
        Get Started
      </button>
    </section>
  );
};

export default Landing;
